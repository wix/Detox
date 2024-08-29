//
//  ViewHierarchyGenerator.swift
//  Detox
//
//  Created by Georgy Steshin on 18/08/2024.
//  Copyright © 2024 Wix. All rights reserved.
//

import Foundation
import UIKit

struct ViewHierarchyGenerator {
    static func generateXml(injectingAccessibilityIdentifiers shouldInject: Bool) -> String {
        let xmlHeader = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
        let viewHierarchy = UIWindow.allKeyWindowSceneWindows
            .filter { !isVisualizerWindow($0) }
            .map { generateXmlForViewHierarchy($0, depth: 1, indexPath: [], shouldInjectIdentifiers: shouldInject) }
            .joined()

        return """
        \(xmlHeader)
        <ViewHierarchy>\(viewHierarchy)
        </ViewHierarchy>
        """
    }

    private static func isVisualizerWindow(_ window: UIWindow) -> Bool {
        return NSStringFromClass(type(of: window)) == "DTXTouchVisualizerWindow"
    }

    private static func generateXmlForViewHierarchy(_ view: UIView, depth: Int, indexPath: [Int], shouldInjectIdentifiers: Bool) -> String {
        let indent = String(repeating: "\t", count: depth)
        let elementName = String(describing: type(of: view))
        let attributes = generateAttributes(for: view, indexPath: indexPath, shouldInjectIdentifiers: shouldInjectIdentifiers)

        var xml = "\n\(indent)<\(elementName)\(attributes)"

        if view.subviews.isEmpty {
            xml += " />"
        } else {
            xml += ">"
            for (index, subview) in view.subviews.enumerated() {
                let subviewIndexPath = indexPath + [index]
                xml += generateXmlForViewHierarchy(subview, depth: depth + 1, indexPath: subviewIndexPath, shouldInjectIdentifiers: shouldInjectIdentifiers)
            }
            xml += "\n\(indent)</\(elementName)>"
        }

        return xml
    }

    private static func generateAttributes(for view: UIView, indexPath: [Int], shouldInjectIdentifiers: Bool) -> String {
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
                // override previously injected identifiers
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
            attributes["text"] = textView.text
        } else if let label = view as? UILabel {
            attributes["text"] = label.text
        }

        return attributes
            .filter { $0.value != "" }
            .map { " \($0)=\"\($1)\"" }
            .sorted()
            .joined()
    }
}
