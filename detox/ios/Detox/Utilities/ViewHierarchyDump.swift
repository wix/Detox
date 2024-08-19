//
//  UIWindow+ViewHierarchy.swift
//  Detox
//
//  Created by Georgy Steshin on 18/08/2024.
//  Copyright © 2024 Wix. All rights reserved.
//

import Foundation
import UIKit

class ViewHierarchyDump {

	static func getViewHierarchyDump(scene: UIWindowScene) -> String {
		let windows = UIWindow.allKeyWindowSceneWindows

		// Create the root ViewHierarchy element
		var xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
		xml.append("\n<ViewHierarchy>")

		// For each window we will dump the hierarchy
		for window in windows {
			//Ignore the touch visualizer window
			if NSStringFromClass(type(of: window)) == "DTXTouchVisualizerWindow" {
				continue
			}

			xml.append(dumpViewHierarchyRecursive(view: window, level: 1))
		}

		xml.append("\n</ViewHierarchy>")

		return xml
	}

	private static func dumpViewHierarchyRecursive(view: UIView, level: Int) -> String {
		let xml = NSMutableString()
		let indent = String(repeating: "\t", count: level)
		let hasSubviews = view.subviews.count != 0

		// Use the view's class name as the element name
		let elementName = String(describing: type(of: view))
		xml.append("\n\(indent)<\(elementName)")
		xml.append(dumpAttributes(view: view))
		if (hasSubviews) {
			xml.append(">")
		} else {
			xml.append(" />")
		}
		// Recursively add subviews
		for subview in view.subviews {
			xml.append(dumpViewHierarchyRecursive(view: subview, level: level + 1))
		}

		if (hasSubviews) {
			// Close the element tag
			xml.append("\n\(indent)</\(elementName)>")
		}

		return xml as String
	}

	private static func dumpAttributes(view: UIView) -> String {
		let attributes = NSMutableString()

		if view.tag != 0 {
			attributes.append(" id=\"\(view.tag)\"")
		}

		attributes.append(" class=\"\(type(of: view))\"")
		attributes.append(" width=\"\(Int(view.frame.size.width))\"")
		attributes.append(" height=\"\(Int(view.frame.size.height))\"")

		let visibility = view.isHidden ? "invisible" : "visible"
		attributes.append(" visibility=\"\(visibility)\"")

		if let superview = view.superview {
			let location = view.convert(view.bounds.origin, to: superview)
			let x = Int(location.x)
			let y = Int(location.y)
			attributes.append(" x=\"\(x)\"")
			attributes.append(" y=\"\(y)\"")
		}

		attributes.append(" alpha=\"\(view.alpha)\"")
		attributes.append(" focused=\"\(view.isFocused)\"")
		attributes.append(" value=\"\(view.accessibilityValue ?? "")\"")
		attributes.append(" label=\"\(view.accessibilityLabel ?? "")\"")

		// Append testID if available
		if let testID = view.accessibilityIdentifier {
			attributes.append(" testID=\"\(testID)\"")
		}

		if let textView = view as? UITextView {
			attributes.append(" text=\"\(textView.text ?? "")\"")
		} else if let label = view as? UILabel {
			attributes.append(" text=\"\(label.text ?? "")\"")
		}

		return attributes as String
	}
}
