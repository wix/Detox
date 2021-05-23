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
		static let targetElement = "targetElement"
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
		
		static let adjustSliderToPosition = "adjustSliderToPosition"
		
		static let setColumnToValue = "setColumnToValue"
		static let setDatePickerDate = "setDatePickerDate"
		static let getAttributes = "getAttributes"
		static let takeScreenshot = "takeScreenshot"
	}
	
	let element : Element
	let kind : String
	let params : [CustomStringConvertible & CustomDebugStringConvertible]?
	
	required init(kind: String, params: [CustomStringConvertible & CustomDebugStringConvertible]?, element: Element) {
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
		
		Kind.adjustSliderToPosition : AdjustSliderAction.self,
		
		Kind.setColumnToValue: SetPickerAction.self,
		Kind.setDatePickerDate: SetDatePickerAction.self,
		Kind.getAttributes: GetAttributesAction.self,
		Kind.takeScreenshot: TakeScreenshotAction.self
	]

	dynamic class func with(dictionaryRepresentation: [String: Any]) throws -> Action {
		let kind = dictionaryRepresentation[Keys.kind] as! String //Crash on failure
		var params = dictionaryRepresentation[Keys.params] as! [CustomStringConvertible & CustomDebugStringConvertible]?
		
		switch kind {
		case Kind.scroll:
			return try ScrollAction.with(dictionaryRepresentation: dictionaryRepresentation)
		case Kind.longPress:
			return try LongPressAction.with(dictionaryRepresentation: dictionaryRepresentation)
		case Kind.tapBackspaceKey:
			params = ["\u{8}"]
		case Kind.tapReturnKey:
			params = ["\n"]
		default:
			break
		}
		
		let actionClass = mapping[kind]! //Crash on failure
		
		let element = try Element.with(dictionaryRepresentation: dictionaryRepresentation)
		return actionClass.init(kind: kind, params: params, element: element)
	}
	
	fileprivate func perform(on element: Element) -> [String: Any]? {
		fatalError("Unimplemented perform(on:) called for \(type(of: self))")
	}
	
	fileprivate func perform(on element: Element, completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		completionHandler(perform(on: element), nil)
	}
	
	func perform(completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		async_action_dtx_try(completionHandler: completionHandler) {
			perform(on: self.element, completionHandler: completionHandler)
		}
	}
	
	var description: String {
		let paramsDescription: String
		if let params = params {
			let str = params.map({
				if let dict = $0 as? [String: Any] {
					//Cast to dictionary here to get the Swift debug description, rather than NSDictionary's 🤦‍♂️
					return dict.debugDescription
				}
				return $0.debugDescription
			}).joined(separator: ", ")
			paramsDescription = "(\(str))"
		} else {
			paramsDescription = ""
		}
		return String(format: "%@%@ WITH %@", self.kind.uppercased(), paramsDescription, element.description)
	}
}

class TapAction : Action {
	override func perform(on element: Element) -> [String: Any]? {
		if let point = params?.first as? [String: Double], let x = point["x"], let y = point["y"] {
			element.tap(at: CGPoint(x: x, y: y))
			
			return nil
		}
		
		//No params or bad params
		element.tap()
		
		return nil
	}
}

class LongPressAction : Action {
	let targetElement: Element?
	
	dynamic override class func with(dictionaryRepresentation: [String: Any]) throws -> Action {
		let params = dictionaryRepresentation[Keys.params] as! [CustomStringConvertible & CustomDebugStringConvertible]?
		let element = try Element.with(dictionaryRepresentation: dictionaryRepresentation)
		let targetElement : Element?
		if let targetElementDic = dictionaryRepresentation[Keys.targetElement] as? [String: Any]{
			targetElement = try Element.with(dictionaryRepresentation: targetElementDic)
		} else {
			targetElement = nil
		}
		
		return LongPressAction(kind: Kind.longPress, params: params, element: element, targetElement: targetElement)
	}
	
	required init(kind: String, params: [CustomStringConvertible & CustomDebugStringConvertible]?, element: Element, targetElement: Element?) {
		self.targetElement = targetElement
		super.init(kind: kind, params: params, element: element)
	}
	
	required init(kind: String, params: [CustomStringConvertible & CustomDebugStringConvertible]?, element: Element) {
		fatalError("Call the other initializer")
	}
	
	override func perform(on element: Element) -> [String: Any]? {
		let duration : TimeInterval
		if let param = params?.first as? Double {
			duration = param.toSeconds()
		} else {
			duration = 1.0
		}
		
		guard let parameters = params, parameters.count > 1 else {
			// Regular long press
			element.longPress(duration: duration)
			return nil
		}
		
		guard let targetElement = self.targetElement else {
			fatalError("Target element is missing")
		}
		
		guard parameters.count > 2 else {
			fatalError("Unknown normalized starting point")
		}
		
		let normalizedStartingPoint = getNormalizedPoint(xPosition: parameters[1], yPosition: parameters[2])
		
		guard parameters.count > 4 else {
			fatalError("Unknown normalized target point")
		}
		
		let normalizedTargetingPoint = getNormalizedPoint(xPosition: parameters[3], yPosition: parameters[4])
		
		var speed = CGFloat(0.5)
		if let speedString = parameters[5] as? String {
			switch speedString {
			case "slow":
				speed = 0.1
				break;
			case "fast":
				speed = 0.5
				break
			default:
				fatalError("Unknown speed")
			}
		}
		
		let endDuration : TimeInterval
		if let param = parameters[6] as? Double {
			endDuration = param.toSeconds()
		} else {
			endDuration = 1.0
		}
		
		element.longPress(at: normalizedStartingPoint, duration: duration, dragToElement: targetElement, normalizedTargetPoint: normalizedTargetingPoint, velocity: speed, holdForDuration: endDuration)
		
		return nil
	}
	
	func getNormalizedPoint(xPosition: Any, yPosition: Any) -> CGPoint {
		let xPos, yPos: Double
		
		if let pos = xPosition as? Double, pos.isNaN == false {
			xPos = pos
		} else {
			xPos = Double.nan
		}

		if let pos = yPosition as? Double, pos.isNaN == false {
			yPos = pos
		} else {
			yPos = Double.nan
		}

		return CGPoint(x: xPos, y: yPos)
	}
}

class MultiTapAction : Action {
	override func perform(on element: Element) -> [String: Any]? {
		let some = params!.first as Any
		let taps = some as! Int
		
		element.tap(numberOfTaps: taps)
		
		return nil
	}
}

class TypeTextAction : Action {
	override func perform(on element: Element) -> [String: Any]? {
		let text = params!.first as! String
		
		element.typeText(text)
		
		return nil
	}
}

class ReplaceTextAction : Action {
	override func perform(on element: Element) -> [String: Any]? {
		let text = params!.first as! String
		
		element.replaceText(text)
		
		return nil
	}
}

class ClearTextAction : Action {
	override func perform(on element: Element) -> [String: Any]? {
		element.clearText()
		
		return nil
	}
}

class ScrollAction : Action {
	let whileExpectation : Expectation?
	
	dynamic override class func with(dictionaryRepresentation: [String: Any]) throws -> Action {
		let params = dictionaryRepresentation[Keys.params] as! [CustomStringConvertible & CustomDebugStringConvertible]?
		let element = try Element.with(dictionaryRepresentation: dictionaryRepresentation)
		let whileExpectation : Expectation?
		if let whileExpectationObj = dictionaryRepresentation[Keys.while] as? [String: Any] {
			whileExpectation = try Expectation.with(dictionaryRepresentation: whileExpectationObj)
		} else {
			whileExpectation = nil
		}
		
		return ScrollAction(kind: Kind.scroll, params: params, element: element, whileExpectation: whileExpectation)
	}
	
	required init(kind: String, params: [CustomStringConvertible & CustomDebugStringConvertible]?, element: Element, whileExpectation: Expectation?) {
		self.whileExpectation = whileExpectation
		super.init(kind: kind, params: params, element: element)
	}
	
	required init(kind: String, params: [CustomStringConvertible & CustomDebugStringConvertible]?, element: Element) {
		fatalError("Call the other initializer")
	}
	
	override func perform(on element: Element) -> [String: Any]? {
		fatalError("Unimplemented perform(on:) called for \(type(of: self))")
	}
	
	fileprivate func perform_async(on element: Element, targetOffset: CGPoint, normalizedStartingPoint: CGPoint, expectation: Expectation, completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		expectation.evaluate { expectationError in
			guard expectationError != nil else {
				completionHandler(nil, nil)
				return
			}
			
			do {
				try dtx_try {
					element.scroll(withOffset: targetOffset, normalizedStartingPoint: normalizedStartingPoint)
				}
			} catch {
				let expectationError = expectationError!
				let expectationDescription = expectationError.localizedDescription.prefix(1).lowercased() + expectationError.localizedDescription.dropFirst()
				let compbinedDescription = "\(error.localizedDescription) and \(expectationDescription)"
				completionHandler(nil, DTXAssertionHandler.error(withReworedReason: compbinedDescription, existingError: expectationError))
				
				return
			}
			
			DispatchQueue.main.async {
				self.perform_async(on: element, targetOffset: targetOffset, normalizedStartingPoint: normalizedStartingPoint, expectation: expectation, completionHandler: completionHandler)
			}
		}
	}
	
	override func perform(on element: Element, completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		let points = params![0] as! Double
		let directionString = params![1] as! String
		let targetOffset : CGPoint
		switch directionString {
		case "up":
			targetOffset = CGPoint(x: 0, y: points)
			break;
		case "down":
			targetOffset = CGPoint(x: 0, y: -points)
			break;
		case "left":
			targetOffset = CGPoint(x: points, y: 0)
			break;
		case "right":
			targetOffset = CGPoint(x: -points, y: 0)
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
		
		guard let whileExpectation = whileExpectation else {
			element.scroll(withOffset: targetOffset, normalizedStartingPoint: normalizedStartingPoint)
			completionHandler(nil, nil)
			
			return
		}
		
		perform_async(on: element, targetOffset: targetOffset, normalizedStartingPoint: normalizedStartingPoint, expectation: whileExpectation, completionHandler: completionHandler)
	}
}

class ScrollToEdgeAction : Action {
	override func perform(on element: Element)  -> [String: Any]? {
		let directionString = params![0] as! String
		let targetEdge : UIRectEdge
		switch directionString {
		case "top":
			targetEdge = .top
			break;
		case "bottom":
			targetEdge = .bottom
			break;
		case "left":
			targetEdge = .left
			break;
		case "right":
			targetEdge = .right
			break;
		default:
			fatalError("Unknown scroll direction")
			break;
		}
		
		element.scroll(to: targetEdge)
		
		return nil
	}
}

class SwipeAction : Action {
	override func perform(on element: Element) -> [String: Any]? {
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
				break
			default:
				fatalError("Unknown pinch speed")
			}
		}
		
		var appliedPercentage = 0.75
		if let percentage = params?[2] as? Double {
			appliedPercentage = percentage
		}
		
		appliedPercentage = Double.minimum(appliedPercentage, 1.0)
		appliedPercentage = Double.maximum(0.0, appliedPercentage)
		
		targetNormalizedOffset.x *= CGFloat(appliedPercentage)
		targetNormalizedOffset.y *= CGFloat(appliedPercentage)
		
		let startPositionX : Double
		if params?.count ?? 0 > 3, let param2 = params?[3] as? Double, param2.isNaN == false {
			startPositionX = param2
		} else {
			startPositionX = Double.nan
		}
		let startPositionY : Double
		if params?.count ?? 0 > 4, let param3 = params?[4] as? Double, param3.isNaN == false {
			startPositionY = param3
		} else {
			startPositionY = Double.nan
		}
		let normalizedStartingPoint = CGPoint(x: startPositionX, y: startPositionY)
		
		element.swipe(normalizedOffset: targetNormalizedOffset, velocity: velocity, normalizedStartingPoint: normalizedStartingPoint)
		
		return nil
	}
}

class LegacyPinchAction : Action {
	override func perform(on element: Element) -> [String: Any]? {
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
		
		element.pinch(withScale: scale, velocity: velocity, angle: angle)
		
		return nil
	}
}

class PinchAction : Action {
	override func perform(on element: Element) -> [String: Any]? {
		let scale = params![0] as! Double
		precondition(scale.isNaN == false && scale > 0.0, "Scale must be a real number above 0.0")
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
		
		element.pinch(withScale: CGFloat(scale), velocity: velocity, angle: angle)
		
		return nil
	}
}

class AdjustSliderAction : Action {
	override func perform(on element: Element) -> [String : Any]? {
		let normalizedPosition = params![0] as! Double
		
		precondition(normalizedPosition >= 0.0 && normalizedPosition <= 1.0, "Normalized position must be with values between 0.0 and 1.0")
		
		element.adjust(toNormalizedSliderPosition: normalizedPosition)
		
		return nil
	}
}

class SetPickerAction : Action {
	override func perform(on element: Element) -> [String: Any]? {
		let some = params![0] as Any
		let column = some as! Int
		let value = params![1] as! String
		
		element.setComponent(column, toValue: value)
		
		return nil
	}
}

class SetDatePickerAction : Action {
	override func perform(on element: Element) -> [String: Any]? {
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
		
		dtx_assert(date != nil, "Incorrect date format “\(formatString)” provided for date string “\(dateString)”")
		
		element.adjust(toDate: date!)
		
		return nil
	}
}

class GetAttributesAction : Action {
	override func perform(completionHandler: @escaping ([String : Any]?, Error?) -> Void) {
		async_action_dtx_try(completionHandler: completionHandler) {
			completionHandler(element.attributes, nil)
		}
	}
}

class TakeScreenshotAction : Action {
	override func perform(completionHandler: @escaping ([String : Any]?, Error?) -> Void) {
		let fileName = params?[0] as? String ?? nil
		async_action_dtx_try(completionHandler: completionHandler) {
			completionHandler(element.takeScreenshot(fileName: fileName), nil)
		}
	}
}
