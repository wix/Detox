//
//  Action.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/21/20.
//

import Foundation
import UIKit

class Action : CustomStringConvertible {
	struct Keys {
		static let kind = "action"
		static let params = "params"
		static let `while` = "while"
	}
	
	enum Kind {
		static let tap = "tap"
		static let tapAtPoint = "tapAtPoint"
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
		static let pinchWithAngle = "pinchWithAngle"
		
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
		Kind.tapAtPoint: TapAction.self,
		Kind.longPress: LongPressAction.self,
		Kind.multiTap: MultiTapAction.self,
		
		Kind.tapBackspaceKey: TypeTextAction.self,
		Kind.tapReturnKey: TypeTextAction.self,
		Kind.typeText: TypeTextAction.self,
		Kind.replaceText: ReplaceTextAction.self,
		Kind.clearText: ClearTextAction.self,
		
		Kind.scroll: ScrollAction.self,
		Kind.scrollTo: ScrollToEdgeAction.self,
		
		Kind.swipe: SwipeAction.self,
		Kind.pinchWithAngle: PinchAction.self,
		
		Kind.setColumnToValue: SetPickerAction.self,
		Kind.setDatePickerDate: SetDatePickerAction.self,
		
		Kind.getAttributes: GetAttributesAction.self
	]
	
	class func with(dictionaryRepresentation: [String: Any]) -> Action {
		let kind = dictionaryRepresentation[Keys.kind] as! String //Crash on failure
		var params = dictionaryRepresentation[Keys.params] as! [CustomStringConvertible]?
		
		let actionClass = mapping[kind]! //Crash on failure
		
		switch kind {
		case Kind.tapBackspaceKey:
			params = ["\u{8}"]
		case Kind.tapReturnKey:
			params = ["\n"]
		default:
			break
		}
		
		let element = Element.with(dictionaryRepresentation: dictionaryRepresentation)
		return actionClass.init(kind: kind, params: params, element: element)
	}
	
	fileprivate func perform(on view: UIView) -> [String: Any]? {
		fatalError("Unimplemented perform(on:) called for \(type(of: self))")
	}
	
	func perform() -> [String: Any]? {
		let view = self.element.view
		
		return perform(on: view)
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
			duration = param
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
	override func perform(on view: UIView) -> [String: Any]? {
		let pixels = params![0] as! Double
		let directionString = params![1] as! String
		let targetOffset : CGPoint
		switch directionString {
		case "up":
			targetOffset = CGPoint(x: 0, y: -pixels)
			break;
		case "down":
			targetOffset = CGPoint(x: 0, y: pixels)
			break;
		case "left":
			targetOffset = CGPoint(x: -pixels, y: 0)
			break;
		case "right":
			targetOffset = CGPoint(x: pixels, y: 0)
			break;
		default:
			fatalError("Unknown scroll direction")
			break;
		}
		let startPositionX : Double
		if let param2 = params?[2] as? Double, param2.isNaN == false {
			startPositionX = param2
		} else {
			startPositionX = 0.5
		}
		let startPositionY : Double
		if let param3 = params?[3] as? Double, param3.isNaN == false {
			startPositionY = param3
		} else {
			startPositionY = 0.5
		}
		
		if let view = view as? UIScrollView {
			view.dtx_scroll(withOffset: targetOffset, normalizedStartingOffset: CGPoint(x: startPositionX, y: startPositionY))
		}
		else {
			assert(false, "View \(view) is not an instance of UISrollView")
		}
		
		//TODO: Handle while
		
		return nil
	}
}

class ScrollToEdgeAction : Action {
	override func perform(on view: UIView)  -> [String: Any]? {
		let directionString = params![0] as! String
		let targetOffset : CGPoint
		switch directionString {
		case "up":
			targetOffset = CGPoint(x: 0, y: -1)
			break;
		case "down":
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
		
		if let view = view as? UIScrollView {
			view.dtx_scroll(toNormalizedEdge: targetOffset)
		}
		else {
			assert(false, "View \(view) is not an instance of UISrollView")
		}
		
		return nil
}

class SwipeAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let directionString = params![0] as! String
		switch directionString {
		case "up":
			element.swipeUp()
			break;
		case "down":
			element.swipeDown()
			break;
		case "left":
			element.swipeLeft()
			break;
		case "right":
			element.swipeRight()
			break;
		default:
			fatalError("Unknown swipe direction")
			break;
		}
		
		return nil
	}
}

class PinchAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let directionString = params![0] as! String
		let scale : CGFloat
		switch directionString {
		case "inward":
			scale = 0.75
			break;
		case "outward":
			scale = 1.25
			break
		default:
			fatalError("Unknown pinch direction")
		}
		var velocity = CGFloat(0.5)
		if let speedString = params?[1] as? String {
			switch speedString {
			case "slow":
				velocity = 1.0
				break;
			case "fast":
				velocity = 0.3
			default:
				fatalError("Unknown pinch speed")
			}
		}
		
		element.pinch(withScale: scale, velocity: velocity)
		
		return nil
	}
}

class SetPickerAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let column = params![0] as! Int
		let value = params![1] as! String
		
		if let view = view as? UIPickerView {
			view.dtx_setComponent(column, toValue: value)
		}
		else {
			assert(false, "View \(view) is not an instance of UIPickerView")
		}

		return nil
	}
}

class SetDatePickerAction : Action {
	override func perform(on view: UIView) -> [String: Any]? {
		let dateString = params![0] as! String
		let formatString = params![1] as! String
		
		let dateFormatter = DateFormatter()
		dateFormatter.dateFormat = formatString
		let date = dateFormatter.date(from: dateString)!
		
		if let view = view as? UIDatePicker {
			view.dtx_adjust(to: date)
		}
		else {
			assert(false, "View \(view) is not an instance of UIDatePicker")
		}
		
		return nil
	}
}

class GetAttributesAction : Action {
	override func perform(on view: UIView) -> [String : Any]? {
		return try! ["attributes": Dictionary(uniqueKeysWithValues: element.snapshot().dictionaryRepresentation.map { return ($0.rawValue, $1) })]
	}
}
