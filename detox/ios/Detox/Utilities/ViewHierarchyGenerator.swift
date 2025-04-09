//
//  ViewHierarchyGenerator.swift
//  Detox
//
//  Created by Georgy Steshin on 18/08/2024.
//  Copyright © 2024 Wix. All rights reserved.
//

import Foundation
import UIKit
import WebKit

private let GET_HTML_SCRIPT = """
    (function() {
    const blacklistedTags = ['script', 'style', 'head', 'meta'];
    const blackListedTagsSelector = blacklistedTags.join(',');

    // Clone the entire document
    var clonedDoc = document.documentElement.cloneNode(true);

    // Remove all <script> and <style> tags from the cloned document
    var scripts = clonedDoc.querySelectorAll(blackListedTagsSelector);
    scripts.forEach(function(script) {
        script.remove();
    });

    // Create an instance of XMLSerializer
    var serializer = new XMLSerializer();

    // Serialize the cloned DOM to a string
    var serializedHtml = serializer.serializeToString(clonedDoc);

    // Return the serialized HTML as a string
    return serializedHtml;
})();
"""

struct ViewHierarchyGenerator {
    private static let maxDepth = 200

    @MainActor
    static func generateXml(injectingAccessibilityIdentifiers shouldInject: Bool) async -> String {
        let xmlHeader = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
        let windows = UIWindow.allKeyWindowSceneWindows
            .filter { !isVisualizerWindow($0) }

        var viewHierarchy = ""
        for window in windows {
            viewHierarchy += await generateXmlForViewHierarchy(window, depth: 1, indexPath: [], shouldInjectIdentifiers: shouldInject)
        }

        return """
        \(xmlHeader)
        <ViewHierarchy>\(viewHierarchy)
        </ViewHierarchy>
        """
    }

    private static func isVisualizerWindow(_ window: UIWindow) -> Bool {
        return NSStringFromClass(type(of: window)) == "DTXTouchVisualizerWindow"
    }

    @MainActor
    private static func generateXmlForViewHierarchy(
        _ view: UIView,
        depth: Int,
        indexPath: [Int],
        shouldInjectIdentifiers: Bool
    ) async -> String {
        guard depth <= maxDepth else { return "" }

        let indent = String(repeating: " ", count: depth)
        let elementName = String(describing: type(of: view))
        let attributes = generateAttributes(for: view, indexPath: indexPath, shouldInjectIdentifiers: shouldInjectIdentifiers)

        var xml = "\n\(indent)<\(elementName)\(attributes)"

        if let webView = view as? WKWebView {
            let htmlContent = await getHtmlFromWebView(webView)
            xml += ">\n\(indent)\t<![CDATA[\(htmlContent)]]>"
            xml += "\n\(indent)</\(elementName)>"
        } else if view.subviews.isEmpty {
            xml += " />"
        } else {
            xml += ">"
            for (index, subview) in view.subviews.enumerated() {
                let subviewIndexPath = indexPath + [index]
                xml += await generateXmlForViewHierarchy(
                    subview,
                    depth: depth + 1,
                    indexPath: subviewIndexPath,
                    shouldInjectIdentifiers: shouldInjectIdentifiers
                )
            }
            xml += "\n\(indent)</\(elementName)>"
        }

        return xml
    }

    @MainActor
    private static func getHtmlFromWebView(_ webView: WKWebView) async -> String {
        let handler = WebViewHandler()

        do {
            try await handler.waitForPageLoad(webView)
        } catch {
            print("Error waiting for page to load: \(error)")
            return "<!-- Error loading page -->"
        }

        return await withCheckedContinuation { continuation in
            webView.evaluateJavaScript(GET_HTML_SCRIPT) { result, error in
                if let html = result as? String {
                    continuation.resume(returning: html)
                } else if let error = error {
                    continuation.resume(returning: "<!-- Error loading HTML: \(error) -->")
                } else {
                    continuation.resume(returning: "<!--- HTML is empty -->")
                }
            }
        }
    }

    private static func generateAttributes(
        for view: UIView,
        indexPath: [Int],
        shouldInjectIdentifiers: Bool
    ) -> String {
        var attributes: [String: String] = [
            "class": "\(type(of: view))",
            "width": "\(toClampedInt(view.frame.size.width))",
            "height": "\(toClampedInt(view.frame.size.height))",
            "visibility": view.isHidden ? "invisible" : "visible",
            "alpha": "\(view.alpha)",
            "focused": "\(view.isFocused)",
            "value": view.accessibilityValue ?? "",
            "label": view.accessibilityLabel ?? ""
        ]

        if view.tag != 0 {
            attributes["tag"] = "\(view.tag)"
        }

        if let superview = view.superview {
            let location = view.convert(view.bounds.origin, to: superview)
            attributes["x"] = "\(toClampedInt(location.x))"
            attributes["y"] = "\(toClampedInt(location.y))"
        }

        if shouldInjectIdentifiers {
            let injectedPrefix = "detox_temp_"
            let injectedIdentifier = "\(injectedPrefix)\(indexPath.map { String($0) }.joined(separator: "_"))"

            if let existingTestID = view.accessibilityIdentifier {
                // Override previously injected identifiers
                if existingTestID.hasPrefix(injectedPrefix) {
                    view.accessibilityIdentifier = injectedIdentifier
                }
            } else {
                view.accessibilityIdentifier = injectedIdentifier
            }
        }

        if let testID = view.accessibilityIdentifier {
            attributes["id"] = testID
        }

        if let textView = view as? UITextView {
            attributes["text"] = textView.text ?? ""
        } else if let label = view as? UILabel {
            attributes["text"] = label.text ?? ""
        }

        return attributes
            .filter { !$0.value.isEmpty }
            .map { " \($0.key)=\"\($0.value)\"" }
            .sorted()
            .joined()
    }
}

@MainActor
class WebViewHandler: NSObject, WKNavigationDelegate {
    private var loadCompletion: ((Result<Void, Error>) -> Void)?

    enum WebViewError: Error {
        case timeout
    }

    func waitForPageLoad(_ webView: WKWebView, timeoutAfter seconds: TimeInterval = 10) async throws {
        webView.navigationDelegate = self

        if !webView.isLoading {
            return
        }

        return try await withCheckedThrowingContinuation { continuation in
            let task = Task {
                try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                loadCompletion?(.failure(WebViewError.timeout))
            }

            self.loadCompletion = { result in
                task.cancel()
                self.loadCompletion = nil
                continuation.resume(with: result)
            }
        }
    }

    nonisolated func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        Task { @MainActor in
            loadCompletion?(.success(()))
        }
    }

    nonisolated func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        Task { @MainActor in
            loadCompletion?(.failure(error))
        }
    }
}

func toClampedInt(_ value: Double) -> Int {
    return Int(min(max(value, Double(Int.min)), Double(Int.max)))
}
