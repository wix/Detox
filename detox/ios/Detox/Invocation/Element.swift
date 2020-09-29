//
//  Element.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/27/20.
//

import Foundation
import UIKit
import WebKit

class Element : NSObject {
	let predicate : Predicate
	let index : Int?
	
	struct Keys {
		static let predicate = "predicate"
		static let index = "atIndex"
	}
	
	required init(predicate: Predicate, index: Int?) {
		self.predicate = predicate
		self.index = index
	}
	
	class func with(dictionaryRepresentation: [String: Any]) throws -> Element {
		let predicateDictionaryRepresentation = dictionaryRepresentation[Keys.predicate] as! [String: Any]
		let index = dictionaryRepresentation[Keys.index] as! Int?
		
		return Element(predicate: try Predicate.with(dictionaryRepresentation: predicateDictionaryRepresentation), index: index)
	}
	
	var exists : Bool {
		do {
			var moreThanZero : Bool = false
			try dtx_try {
				moreThanZero = self.views.count > 0
			}
			return moreThanZero
		} catch {
			return false
		}
	}
	
//	private var cachedViews : [UIView]?
	private var views : [UIView] {
//		if let cachedViews = cachedViews {
//			return cachedViews
//		}
		
		//TODO: Consider searching here in all windows from all scenes.
		let array = (UIView.dtx_findViewsInKeySceneWindows(passing: predicate.predicateForQuery()) as! [UIView])
		
		guard array.count > 0 else {
			dtx_fatalError("No elements found for “\(self.description)”", viewDescription: inDebugAttributes ? nil : debugAttributes)
		}
		
//		cachedViews = array
		
		return array
	}
	
	private var view : UIView {
		let array = self.views
		
		let element : UIView
		if let index = index {
			guard index < array.count else {
				dtx_fatalError("Index \(index) beyond bounds [0 .. \(array.count - 1)] for “\(self.description)”")
			}
			element = array[index]
		} else {
			//Will fail test if more than one element are resolved from the query
			guard array.count == 1 else {
				dtx_fatalError("Multiple elements found for “\(self.description)”", viewDescription: inDebugAttributes ? nil : debugAttributes)
			}
			element = array.first!
		}
		
		return element
	}
	
	private func extractScrollView() -> UIScrollView {
		if let view = self.view as? UIScrollView {
			return view
		}
		else if let view = self.view as? WKWebView {
			return view.scrollView
		} else if ReactNativeSupport.isReactNativeApp && NSStringFromClass(type(of: view)) == "RCTScrollView" {
			return (view.value(forKey: "scrollView") as! UIScrollView)
		}
		
		dtx_fatalError("View “\(self.view.dtx_shortDescription)” is not an instance of “UISrollView”", viewDescription: debugAttributes)
	}
	
	override var description: String {
		return String(format: "MATCHER(%@)%@", predicate.description, index != nil ? " AT INDEX(\(index!))" : "")
	}
	
	fileprivate var inDebugAttributes = false
	var debugAttributes: [String: Any] {
		inDebugAttributes = true
		defer {
			inDebugAttributes = false
		}
		do {
//			guard failed == false else {
//				throw "Nope"
//			}
			var rv: [String: Any]! = nil
			try dtx_try {
				rv = view.dtx_viewDebugAttributes
			}
			return rv
		} catch {
			guard let keyWindow = UIWindow.dtx_keyWindow else {
				return [:]
			}
			return ["viewHierarchy": keyWindow.recursiveDescription!]
		}
	}
	
	func tap(at point: CGPoint? = nil, numberOfTaps: Int = 1) {
		guard let point = point else {
			view.dtx_tapAtAccessibilityActivationPoint(withNumberOfTaps: UInt(numberOfTaps))
			return
		}
		
		view.dtx_tap(atPoint: point, numberOfTaps: UInt(numberOfTaps))
	}
	
	func longPress(at point: CGPoint? = nil, duration: TimeInterval = 1.0) {
		guard let point = point else {
			view.dtx_longPressAtAccessibilityActivationPoint(forDuration: duration)
			return
		}
		
		view.dtx_longPress(atPoint: point, duration: duration)
	}
	
	func swipe(normalizedOffset: CGPoint, velocity: CGFloat = 1.0) {
		view.dtx_swipe(withNormalizedOffset: normalizedOffset, velocity: velocity)
	}
	
	func pinch(withScale scale: CGFloat, velocity: CGFloat = 2.0, angle: CGFloat = 0.0) {
		view.dtx_pinch(withScale: scale, velocity: velocity, angle: angle)
	}
	
	func scroll(toNormalizedEdge edge: CGPoint) {
		let scrollView = extractScrollView()
		
		scrollView.dtx_scroll(toNormalizedEdge: edge)
	}

	func scroll(withOffset offset: CGPoint, normalizedStartingPoint: CGPoint? = nil) {
		let scrollView = extractScrollView()
		
		if let normalizedStartingPoint = normalizedStartingPoint {
			scrollView.dtx_scroll(withOffset: offset, normalizedStartingPoint: normalizedStartingPoint)
		} else {
			scrollView.dtx_scroll(withOffset: offset)
		}
	}
	
	func clearText() {
		view.dtx_clearText()
	}

	func typeText(_ text: String) {
		view.dtx_typeText(text)
	}

	func replaceText(_ text: String) {
		view.dtx_replaceText(text)
	}
	
	func adjust(toDate date: Date) {
		if let view = view as? UIDatePicker {
			view.dtx_adjust(to: date)
		} else {
			dtx_fatalError("View “\(view.dtx_shortDescription)” is not an instance of “UIDatePicker”", viewDescription: debugAttributes)
		}
	}
	
	func setComponent(_ component: Int, toValue value: Any) {
		if let view = view as? UIPickerView {
			view.dtx_setComponent(component, toValue: value)
		} else {
			dtx_fatalError("View “\(view.dtx_shortDescription)” is not an instance of “UIPickerView”", viewDescription: debugAttributes)
		}
	}
	
	func adjust(toNormalizedSliderPosition normalizedSliderPosition: Double) {
		guard let slider = view as? UISlider else {
			dtx_fatalError("View \(view.dtx_shortDescription) is not instance of “UISlider”", viewDescription: debugAttributes)
		}
		
		slider.dtx_normalizedSliderPosition = normalizedSliderPosition
	}
	
	func isVisible() throws -> Bool {
		var error: NSError? = nil
		let rv = view.dtx_isVisible(at: view.dtx_accessibilityActivationPointInViewCoordinateSpace, error: &error)
		if let error = error {
			throw error
		}
		
		return rv
	}
	
	func isHittable() throws -> Bool {
		var error: NSError? = nil
		let rv = view.dtx_isHittable(at: view.dtx_accessibilityActivationPointInViewCoordinateSpace, error: &error)
		if let error = error {
			throw error
		}
		
		return rv
	}
	
	@objc
	var text: String? {
		return view.value(forKey: "text") as? String
	}
	
	@objc
	var placeholder: String? {
		return view.value(forKey: "placeholder") as? String
	}
	
	@objc
	var identifier: String? {
		return view.accessibilityIdentifier
	}
	
	@objc
	var label: String? {
		return view.accessibilityLabel
	}
	
	@objc
	var value: String? {
		return view.accessibilityValue
	}
	
	@objc
	var normalizedSliderPosition: Double {
		get {
			guard let slider = view as? UISlider else {
				dtx_fatalError("View \(view.dtx_shortDescription) is not instance of “UISlider”", viewDescription: debugAttributes)
			}
			
			return slider.dtx_normalizedSliderPosition
		}
	}
	
	@objc
	var attributes: [String : Any] {
		let views = self.views
		
		if views.count == 1 {
			return views.first!.dtx_attributes
		} else {
			let elements = views.map {
				return $0.dtx_attributes
			}
			
			return ["elements": elements]
		}
	}
}
