//
//  DetoxUserNotificationsShared.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 10/15/19.
//

import Foundation

public struct DetoxUserNotificationKeys {
	struct TriggerTypes {
		static let push = "push"
		static let calendar = "calendar"
		static let location = "location"
		static let timeInterval = "timeInterval"
	}
	
	static let trigger = "trigger"
	static let type = "type"
	static let absoluteTriggerType = "__triggerType"
	static let payload = "payload"
	static let aps = "aps"
	static let alert = "alert"
	static let title = "title"
	static let subtitle = "subtitle"
	static let body = "body"
	static let badge = "badge"
	static let category = "category"
	static let userText = "user-text"
	static let contentAvailable = "content-available"
	static let actionIdentifier = "action-identifier"
	static let dateComponents = "date-components"
	static let repeats = "repeats"
	static let region = "region"
	static let identifier = "identifier"
	static let center = "center"
	static let latitude = "latitude"
	static let longitude = "longitude"
	static let radius = "radius"
	static let notifyOnEntry = "notifyOnEntry"
	static let notifyOnExit = "notifyOnExit"
	static let timeInterval = "timeInterval"
}

public let supportedTriggerTypes = [DetoxUserNotificationKeys.TriggerTypes.push, DetoxUserNotificationKeys.TriggerTypes.calendar, DetoxUserNotificationKeys.TriggerTypes.location, DetoxUserNotificationKeys.TriggerTypes.timeInterval]
