//
//  DetoxUserNotificationParser.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 10/15/19.
//

import UIKit

public class DetoxUserNotificationParser: NSObject {
	@objc
	public class func parseUserNotificationData(url: URL) -> [String: Any] {
		
		guard let data = try? Data.init(contentsOf: url) else {
			Swift.fatalError("Unable to read user notification data file.")
		}
		
		guard var jsonObject = (try? JSONSerialization.jsonObject(with: data, options: .init(rawValue: 0)) as? [String: Any]) else {
			Swift.fatalError("Unable to parse user notification data file.")
		}
		
		guard let trigger = jsonObject[DetoxUserNotificationKeys.trigger] as? [String: AnyObject], let triggerType = trigger[DetoxUserNotificationKeys.type] as? String, supportedTriggerTypes.contains(triggerType) else {
			Swift.fatalError("Missing trigger or invalid trigger type. A 'trigger' key must exist, with one of the following types: '\(supportedTriggerTypes.joined(separator: "', '"))'")
		}
		
		jsonObject[DetoxUserNotificationKeys.absoluteTriggerType] = triggerType
		
		return jsonObject
	}
}
