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
    const blacklistedTags = ['script', 'style', 'head', 'meta'];
    const blackListedTagsSelector = blacklistedTags.join(',');

    (function() {
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
    @MainActor
    static func generateXml(injectingAccessibilityIdentifiers shouldInject: Bool) async -> String {
        let xmlHeader = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
        let windows = UIWindow.allKeyWindowSceneWindows
            .filter { !isVisualizerWindow($0) }

        var viewHierarchy = ""
        for window in windows {
            viewHierarchy += await generateXmlForViewHierarchy(window, shouldInjectIdentifiers: shouldInject)
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

    enum StackItem {
        case view(UIView, Int, [Int])       // View to process
        case closeTag(String, Int)          // Closing tag for a view
    }

    @MainActor
    private static func generateXmlForViewHierarchy(_ rootView: UIView, shouldInjectIdentifiers: Bool) async -> String {
        var stack: [StackItem] = [.view(rootView, 1, [])]
        var xml = ""

        while let item = stack.popLast() {
            switch item {
                case .view(let view, let depth, let indexPath):
                    let indent = String(repeating: " ", count: depth)
                    let elementName = String(describing: type(of: view))
                    let attributes = generateAttributes(for: view, indexPath: indexPath, shouldInjectIdentifiers: shouldInjectIdentifiers)

                    xml += "\n\(indent)<\(elementName)\(attributes)"

                    if let webView = view as? WKWebView {
                        let htmlContent = await getHtmlFromWebView(webView)
                        xml += ">\n\(indent)\t<![CDATA[\(htmlContent)]]>"
                        xml += "\n\(indent)</\(elementName)>"
                    } else if view.subviews.isEmpty {
                        xml += " />"
                    } else {
                        xml += ">"
                        stack.append(.closeTag(elementName, depth))

                        let subviews = view.subviews
                        for (index, subview) in subviews.enumerated().reversed() {
                            let subviewIndexPath = indexPath + [index]
                            stack.append(.view(subview, depth + 1, subviewIndexPath))
                        }
                    }

                case .closeTag(let elementName, let depth):
                    let indent = String(repeating: " ", count: depth)
                    xml += "\n\(indent)</\(elementName)>"
            }
        }

        return xml
    }

    @MainActor
    private static func getHtmlFromWebView(_ webView: WKWebView) async -> String {
        await withCheckedContinuation { continuation in
            webView.evaluateJavaScript(GET_HTML_SCRIPT) { result, error in
                if let html = result as? String {
                    continuation.resume(returning: html)
                } else if let error = error {
                    print("Error extracting HTML: \(error)")
                    continuation.resume(returning: "<!-- Error loading HTML -->")
                } else {
                    continuation.resume(returning: "html is empty")
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
            "width": "\(Int(view.frame.size.width))",
            "height": "\(Int(view.frame.size.height))",
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
            attributes["x"] = "\(Int(location.x))"
            attributes["y"] = "\(Int(location.y))"
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
            attributes["testID"] = testID
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
