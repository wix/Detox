//
//  Action.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/21/20.
//

import Foundation
import UIKit

@inline(__always)
@discardableResult
fileprivate func async_action_dtx_try(completionHandler: @escaping ([String: Any]?, Error?) -> Void, blockToTry: () -> Void) -> Bool {
	do {
		try dtx_try(blockToTry)
	} catch {
		completionHandler(nil, error)
		return false
	}
	
	return true
}

class Action : CustomStringConvertible {
	struct Keys {
		static let kind = "action"
		static let params = "params"
		static let `while` = "while"
	}
	
	enum Kind {
		static let tap = "tap"
		static let longPress = "longPress"
		static let multiTap = "multiTap"
		
		static let tapBackspaceKey = "tapBackspaceKey"
		static let tapReturnKey = "tapReturnKey"
		static let typeText = "typeText"
		static let replaceText = "replaceText"
		static let clearText = "clearText"
		
		static let scroll = "scroll"
		static let scrollTo = "scrollTo"
		
		static let swipe = "swipe"
		static let pinch = "pinch"
		static let pinchWithAngleLegacy = "pinchWithAngle"
		
		static let setColumnToValue = "setColumnToValue"
		static let setDatePickerDate = "setDatePickerDate"
		
		static let getAttributes = "getAttributes"
	}
	
	let element : Element
	let kind : String
	let params : [CustomStringConvertible]?
	
	required init(kind: String, params: [CustomStringConvertible]?, element: Element) {
		self.element = element
		self.kind = kind
		self.params = params
	}
	
	static let mapping : [String: Action.Type] = [
		Kind.tap: TapAction.self,
		Kind.longPress: LongPressAction.self,
		Kind.multiTap: MultiTapAction.self,
		
		Kind.tapBackspaceKey: TypeTextAction.self,
		Kind.tapReturnKey: TypeTextAction.self,
		Kind.typeText: TypeTextAction.self,
		Kind.replaceText: ReplaceTextAction.self,
		Kind.clearText: ClearTextAction.self,
	
		Kind.scrollTo: ScrollToEdgeAction.self,
		
		Kind.swipe: SwipeAction.self,
		Kind.pinch: PinchAction.self,
		Kind.pinchWithAngleLegacy: LegacyPinchAction.self,
		
		Kind.setColumnToValue: SetPickerAction.self,
		Kind.setDatePickerDate: SetDatePickerAction.self,
		
		Kind.getAttributes: GetAttributesAction.self
	]

	dynamic class func with(dictionaryRepresentation: [String: Any]) -> Action {
		let kind = dictionaryRepresentation[Keys.kind] as! String //Crash on failure
		var params = dictionaryRepresentation[Keys.params] as! [CustomStringConvertible]?
		
		switch kind {
		case Kind.scroll:
			return ScrollAction.with(dictionaryRepresentation: dictionaryRepresentation)
		case Kind.tapBackspaceKey:
			params = ["\u{8}"]
		case Kind.tapReturnKey:
			params = ["\n"]
		default:
			break
		}
		
		let actionClass = mapping[kind]! //Crash on failure
		
		let element = Element.with(dictionaryRepresentation: dictionaryRepresentation)
		return actionClass.init(kind: kind, params: params, element: element)
	}
	
	fileprivate func perform(on view: UIView) -> [String: Any]? {
		fatalError("Unimplemented perform(on:) called for \(type(of: self))")
	}
	
	fileprivate func perform(on view: UIView, completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		//Normally, actions are synchronous, so this is enough.
		async_action_dtx_try(completionHandler: completionHandler) {
			completionHandler(perform(on: view), nil)
		}
	}
	
	func perform(completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		async_action_dtx_try(completionHandler: completionHandler) {
			let view = self.element.view
			
			perform(on: view, completionHandler: completionHandler)
		}
	}
	
	var description: String {
		get {
			return String(format: "%@%@ WITH %@", self.kind.uppercased(), params != nil ? "(\(params!.map{$0.description} .joined(separator: ", ")))" : "", element.description)
		}
	}
}

class TapAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		if let point = params?.first as? [String: Double], let x = point["x"], let y = point["y"] {
			view.dtx_tap(atPoint: CGPoint(x: x, y: y), numberOfTaps: 1)
			
			return nil
		}
		
		//No params or bad params
		view.dtx_tapAtAccessibilityActivationPoint()
		
		return nil
	}
}

class LongPressAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let duration : TimeInterval
		if let param = params?.first as? TimeInterval {
			duration = param.fromMSToSeconds()
		} else {
			//TODO: Check default value in Detox
			duration = 0.8
		}
		
		view.dtx_longPressAtAccessibilityActivationPoint(forDuration: duration)
		
		return nil
	}
}

class MultiTapAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let taps = params!.first as! UInt
		view.dtx_tapAtAccessibilityActivationPoint(withNumberOfTaps: taps)
		
		return nil
	}
}

class TypeTextAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let text = params!.first as! String
		
		view.dtx_typeText(text)
		
		return nil
	}
}

class ReplaceTextAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let text = params!.first as! String
		
		view .dtx_replaceText(text)
		
		return nil
	}
}

class ClearTextAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		view.dtx_clearText()
		
		return nil
	}
}

class ScrollAction : Action {
	let whileExpectation : Expectation?
	
	dynamic override class func with(dictionaryRepresentation: [String: Any]) -> Action {
		let params = dictionaryRepresentation[Keys.params] as! [CustomStringConvertible]?
		let element = Element.with(dictionaryRepresentation: dictionaryRepresentation)
		let whileExpectation : Expectation?
		if let whileExpectationObj = dictionaryRepresentation[Keys.while] as? [String: Any] {
			whileExpectation = Expectation.with(dictionaryRepresentation: whileExpectationObj)
		} else {
			whileExpectation = nil
		}
		
		return ScrollAction(kind: Kind.scroll, params: params, element: element, whileExpectation: whileExpectation)
	}
	
	required init(kind: String, params: [CustomStringConvertible]?, element: Element, whileExpectation: Expectation?) {
		self.whileExpectation = whileExpectation
		super.init(kind: kind, params: params, element: element)
	}
	
	required init(kind: String, params: [CustomStringConvertible]?, element: Element) {
		fatalError("Call the other initializer")
	}
	
	override func perform(on view: UIView) -> [String: Any]? {
		fatalError("Unimplemented perform(on:) called for \(type(of: self))")
	}
	
	fileprivate func perform_async(on scrollView: UIScrollView, targetOffset: CGPoint, normalizedStartingPoint: CGPoint, expectation: Expectation, completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		expectation.evaluate { error in
			guard error != nil else {
				completionHandler(nil, nil)
				return
			}
			
			guard async_action_dtx_try(completionHandler: completionHandler, blockToTry: { scrollView.dtx_scroll(withOffset: targetOffset, normalizedStartingPoint: normalizedStartingPoint) }) else {
				return
			}
			
			DispatchQueue.main.async {
				self.perform_async(on: scrollView, targetOffset: targetOffset, normalizedStartingPoint: normalizedStartingPoint, expectation: expectation, completionHandler: completionHandler)
			}
		}
	}
	
	override func perform(on view: UIView, completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		let pixels = params![0] as! Double
		let directionString = params![1] as! String
		let targetOffset : CGPoint
		switch directionString {
		case "up":
			targetOffset = CGPoint(x: 0, y: pixels)
			break;
		case "down":
			targetOffset = CGPoint(x: 0, y: -pixels)
			break;
		case "left":
			targetOffset = CGPoint(x: pixels, y: 0)
			break;
		case "right":
			targetOffset = CGPoint(x: -pixels, y: 0)
			break;
		default:
			fatalError("Unknown scroll direction")
			break;
		}
		let startPositionX : Double
		
		if params?.count ?? 0 > 2, let param2 = params?[2] as? Double, param2.isNaN == false {
			startPositionX = param2
		} else {
			startPositionX = Double.nan
		}
		let startPositionY : Double
		if params?.count ?? 0 > 3, let param3 = params?[3] as? Double, param3.isNaN == false {
			startPositionY = param3
		} else {
			startPositionY = Double.nan
		}
		let normalizedStartingPoint = CGPoint(x: startPositionX, y: startPositionY)
		
		let scrollView = view.extractScrollView()
		
		guard let whileExpectation = whileExpectation else {
			async_action_dtx_try(completionHandler: completionHandler) {
				scrollView.dtx_scroll(withOffset: targetOffset, normalizedStartingPoint: normalizedStartingPoint)
				completionHandler(nil, nil)
			}
			
			return
		}
		
		perform_async(on: scrollView, targetOffset: targetOffset, normalizedStartingPoint: normalizedStartingPoint, expectation: whileExpectation, completionHandler: completionHandler)
	}
}

class ScrollToEdgeAction : Action {
	override func perform(on view: UIView)  -> [String: Any]? {
		let directionString = params![0] as! String
		let targetOffset : CGPoint
		switch directionString {
		case "top":
			targetOffset = CGPoint(x: 0, y: -1)
			break;
		case "bottom":
			targetOffset = CGPoint(x: 0, y: 1)
			break;
		case "left":
			targetOffset = CGPoint(x: -1, y: 0)
			break;
		case "right":
			targetOffset = CGPoint(x: 1, y: 0)
			break;
		default:
			fatalError("Unknown scroll direction")
			break;
		}
		
		let scrollView = view.extractScrollView()
		scrollView.dtx_scroll(toNormalizedEdge: targetOffset)
		
		return nil
	}
}

class SwipeAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		var targetNormalizedOffset : CGPoint
		let directionString = params![0] as! String
		switch directionString {
		case "up":
			targetNormalizedOffset = CGPoint(x: 0, y: -1)
			break;
		case "down":
			targetNormalizedOffset = CGPoint(x: 0, y: 1)
			break;
		case "left":
			targetNormalizedOffset = CGPoint(x: -1, y: 0)
			break;
		case "right":
			targetNormalizedOffset = CGPoint(x: 1, y: 0)
			break;
		default:
			fatalError("Unknown swipe direction")
			break;
		}
		
		var velocity = CGFloat(1.0)
		if let speedString = params?[1] as? String {
			switch speedString {
			case "slow":
				velocity = 0.5
				break;
			case "fast":
				velocity = 1.0
			default:
				fatalError("Unknown pinch speed")
			}
		}
		
		if var percentage = params?[2] as? Double {
			percentage = Double.minimum(percentage, 1.0)
			percentage = Double.maximum(0.0, percentage)
			
			targetNormalizedOffset.x *= CGFloat(percentage)
			targetNormalizedOffset.y *= CGFloat(percentage)
		}
		
		view.dtx_swipe(withNormalizedOffset: targetNormalizedOffset, velocity: velocity)
		
		return nil
	}
}

class LegacyPinchAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let directionString = params![0] as! String
		var scale : CGFloat
		switch directionString {
		case "inward":
			scale = 0.75
			break;
		case "outward":
			scale = 1.5
			break
		default:
			fatalError("Unknown pinch direction")
		}
		var velocity = CGFloat(1.0)
		if let speedString = params?[1] as? String {
			switch speedString {
			case "slow":
				velocity = 1.0
				break;
			case "fast":
				velocity = 2.0
			default:
				fatalError("Unknown pinch speed")
			}
		}
		var angle = CGFloat(0.0)
		if let angleDouble = params?[2] as? Double {
			angle = CGFloat(angleDouble)
		}
		
		view.dtx_pinch(withScale: scale, velocity: velocity, angle: angle)
		
		return nil
	}
}

class PinchAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let scale = params![0] as! Double
		assert(scale.isNaN == false && scale > 0.0, "Scale must be a real number above 0.0")
		var velocity = CGFloat(2.0)
		if let speedString = params?[1] as? String {
			switch speedString {
			case "slow":
				velocity = 1.0
				break;
			case "fast":
				velocity = 2.0
			default:
				fatalError("Unknown pinch speed")
			}
		}
		var angle = CGFloat(0.0)
		if let angleDouble = params?[2] as? Double {
			angle = CGFloat(angleDouble)
		}
		
		view.dtx_pinch(withScale: CGFloat(scale), velocity: velocity, angle: angle)
		
		return nil
	}
}


class SetPickerAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let column = params![0] as! Int
		let value = params![1] as! String
		
		if let view = view as? UIPickerView {
			view.dtx_setComponent(column, toValue: value)
		} else {
			dtx_fatalError("View “\(view.dtx_shortDescription)” is not an instance of “UIPickerView”", view: view)
		}

		return nil
	}
}

class SetDatePickerAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let dateString = params![0] as! String
		let formatString = params![1] as! String
		
		let date: Date?
		if formatString == "ISO8601" {
			let dateFormatter = ISO8601DateFormatter()
			date = dateFormatter.date(from: dateString)
		}
		else {
			let dateFormatter = DateFormatter()
			dateFormatter.dateFormat = formatString
			date = dateFormatter.date(from: dateString)
		}
		
		dtx_assert(date != nil, "Incorrect date format “\(formatString)” provided for date string “\(dateString)”", view: view)
		
		if let view = view as? UIDatePicker {
			view.dtx_adjust(to: date!)
		} else {
			dtx_fatalError("View “\(view.dtx_shortDescription)” is not an instance of “UIDatePicker”", view: view)
		}
		
		return nil
	}
}

class GetAttributesAction : Action {
	override func perform(on view: UIView) -> [String : Any]? {
		return view.dtx_attributes
	}
}
