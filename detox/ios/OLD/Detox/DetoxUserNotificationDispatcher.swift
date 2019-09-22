//
//  DetoxUserNotificationDispatcher.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 22/01/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

import UIKit
import UserNotifications
import UserNotificationsPrivate
import CoreLocation

private struct DetoxUserNotificationKeys {
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

@objc(DetoxUserNotificationDispatcher)
public class DetoxUserNotificationDispatcher: NSObject {
	@objc let userNotificationData : [String: Any]
	private let appStateAtCreation : UIApplication.State
	
	@objc(initWithUserNotificationDataURL:)
	public init(userNotificationDataUrl: URL) {
		userNotificationData = DetoxUserNotificationDispatcher.parseUserNotificationData(url: userNotificationDataUrl)
		appStateAtCreation = UIApplication.shared.applicationState
		
		super.init()
	}
	
	@objc(dispatchOnAppDelegate:simulateDuringLaunch:)
	public func dispatch(on appDelegate: UIApplicationDelegate, simulateDuringLaunch: Bool) {
		guard let userNotificationsDelegate = UNUserNotificationCenter.current().delegate, let actualDelegateMethod = userNotificationsDelegate.userNotificationCenter(_:didReceive:withCompletionHandler:) else {
			return
		}
		let notification = userNotification()
		
		let handler : (UNNotificationPresentationOptions) -> Void = { (options) in
			guard options.contains(.alert) else {
				return
			}
			
			actualDelegateMethod(UNUserNotificationCenter.current(), self.userNotificationResponse(notification: notification), {})
		}
		
		let isAppActive = simulateDuringLaunch == false && appStateAtCreation == .active
		
		if isAppActive == true, let actualWillPresentDelegateMethod = userNotificationsDelegate.userNotificationCenter(_:willPresent:withCompletionHandler:) {
			actualWillPresentDelegateMethod(UNUserNotificationCenter.current(), notification, handler)
		} else {
			handler(isAppActive == false ? [ .alert ] : [])
		}
	}
	
	private static let supportedTriggerTypes = [DetoxUserNotificationKeys.TriggerTypes.push, DetoxUserNotificationKeys.TriggerTypes.calendar, DetoxUserNotificationKeys.TriggerTypes.location, DetoxUserNotificationKeys.TriggerTypes.timeInterval]

	private class func parseUserNotificationData(url: URL) -> [String: Any] {
		
		guard let data = try? Data.init(contentsOf: url) else {
			Swift.fatalError("Unable to read user notification data file.")
		}
		
		guard var jsonObject = (try? JSONSerialization.jsonObject(with: data, options: .init(rawValue: 0)) as! [String: Any]) else {
			Swift.fatalError("Unable to parse user notification data file.")
		}
		
		guard let trigger = jsonObject[DetoxUserNotificationKeys.trigger] as? [String: AnyObject], let triggerType = trigger[DetoxUserNotificationKeys.type] as? String, supportedTriggerTypes.contains(triggerType) else {
			Swift.fatalError("Missing trigger or invalid trigger type. A 'trigger' key must exist, with one of the following types: '\(supportedTriggerTypes.joined(separator: "', '"))'")
		}
		
		jsonObject[DetoxUserNotificationKeys.absoluteTriggerType] = triggerType
		
		return jsonObject
	}
	
	@objc public private(set) lazy var remoteNotificationDictionary : [String: Any]? = {
		[unowned self] in
		guard self.userNotificationData[DetoxUserNotificationKeys.absoluteTriggerType] as! String == DetoxUserNotificationKeys.TriggerTypes.push else {
			return nil;
		}
		
		return self.payload
	}()
	
	private lazy var userPayload : [String: Any] = {
		return self.userNotificationData[DetoxUserNotificationKeys.payload] as? [String: Any] ?? [:]
	}()
	
	private lazy var payload : [String: Any] = {
		[unowned self] in
		var rv : [String: Any] = self.userPayload
		var aps = rv[DetoxUserNotificationKeys.aps] as? [String: Any] ?? [:]
		var alert = aps[DetoxUserNotificationKeys.alert] as? [String: Any] ?? [:]
		
		alert[DetoxUserNotificationKeys.title] = self.userNotificationData[DetoxUserNotificationKeys.title]
		alert[DetoxUserNotificationKeys.subtitle] = self.userNotificationData[DetoxUserNotificationKeys.subtitle]
		alert[DetoxUserNotificationKeys.body] = self.userNotificationData[DetoxUserNotificationKeys.body]
		
		aps[DetoxUserNotificationKeys.alert] = alert
		
		aps[DetoxUserNotificationKeys.badge] = self.userNotificationData[DetoxUserNotificationKeys.badge]
		aps[DetoxUserNotificationKeys.category] = self.userNotificationData[DetoxUserNotificationKeys.category]
		aps[DetoxUserNotificationKeys.contentAvailable] = self.userNotificationData[DetoxUserNotificationKeys.contentAvailable]
		
		rv[DetoxUserNotificationKeys.aps] = aps
		return rv
		
	}()
	
	private class func fatalError(forMissingKey key: @autoclosure () -> String, in context: @autoclosure () -> String) -> Never {
		Swift.fatalError("\(context().uppercased()) requested but no \(key()) found or in incorrect format.")
	}
	
	private class func value<T>(for key: String, `in` data: [String: Any], ofType type: T.Type, context: String) -> T {
		guard let rv = data[key] as? T else {
			fatalError(forMissingKey: key, in: context)
		}
		return rv
	}
	
	private class func dateComponents(from data: [String: Any]) -> DateComponents {
		let rv = NSDateComponents()
		
		data.forEach {
			rv.setValue($1, forKey: $0)
		}
		
		return rv as DateComponents
	}
	
	private class func coord(from data: [String: Any]) -> CLLocationCoordinate2D {
		var coord = CLLocationCoordinate2D()
	
		coord.latitude = value(for: DetoxUserNotificationKeys.latitude, in: data, ofType: CLLocationDegrees.self, context: "coordinate")
		coord.longitude = value(for: DetoxUserNotificationKeys.longitude, in: data, ofType: CLLocationDegrees.self, context: "coordinate")
		
		return coord
	}
	
	private class func region(from data: [String: Any]) -> CLRegion {
		let centerData = value(for: DetoxUserNotificationKeys.center, in: data, ofType: [String: Any].self, context: "region")
		let center = coord(from: centerData)
		let radius = value(for: DetoxUserNotificationKeys.radius, in: data, ofType: CLLocationDistance.self, context: "region")
		let identifier = value(for: DetoxUserNotificationKeys.identifier, in: data, ofType: String.self, context: "region")
		
		let region = CLCircularRegion(center: center, radius: radius, identifier: identifier)
		region.notifyOnEntry = data[DetoxUserNotificationKeys.notifyOnEntry] as? Bool ?? true
		region.notifyOnExit = data[DetoxUserNotificationKeys.notifyOnExit] as? Bool ?? true
		return region
	}
	
	public func userNotification() -> UNNotification {
		let notificationContent = UNMutableNotificationContent()
		notificationContent.badge = userNotificationData[DetoxUserNotificationKeys.badge] as? NSNumber
		notificationContent.body = userNotificationData[DetoxUserNotificationKeys.body] as? String ?? ""
		notificationContent.categoryIdentifier = userNotificationData[DetoxUserNotificationKeys.category] as? String ?? ""
		notificationContent.subtitle = userNotificationData[DetoxUserNotificationKeys.subtitle] as? String ?? ""
		notificationContent.title = userNotificationData[DetoxUserNotificationKeys.title] as? String ?? ""
		
		notificationContent.userInfo = payload
		
		let repeats = userNotificationData[DetoxUserNotificationKeys.repeats] as? Bool ?? false
		
		let triggerData = userNotificationData[DetoxUserNotificationKeys.trigger] as! [String: Any]
		
		var trigger : UNNotificationTrigger? = nil
		switch userNotificationData[DetoxUserNotificationKeys.absoluteTriggerType] as! String {
		case DetoxUserNotificationKeys.TriggerTypes.push:
			let contentAvailable = userNotificationData[DetoxUserNotificationKeys.contentAvailable] as? Bool ?? false
			trigger = UNPushNotificationTrigger(contentAvailable: contentAvailable, mutableContent: false)
			break
		case DetoxUserNotificationKeys.TriggerTypes.calendar:
			let dateComponentsData = DetoxUserNotificationDispatcher.value(for: DetoxUserNotificationKeys.dateComponents, in: triggerData, ofType: [String: Any].self, context: "calendar trigger")
			let dc = DetoxUserNotificationDispatcher.dateComponents(from: dateComponentsData)
			trigger = UNCalendarNotificationTrigger(dateMatching: dc, repeats: repeats)
			break
		case DetoxUserNotificationKeys.TriggerTypes.location:
			let regionData = DetoxUserNotificationDispatcher.value(for: DetoxUserNotificationKeys.region, in: triggerData, ofType: [String: Any].self, context: "location trigger")
			let rgn = DetoxUserNotificationDispatcher.region(from: regionData)
			trigger = UNLocationNotificationTrigger(region: rgn, repeats: repeats)
			break
		case DetoxUserNotificationKeys.TriggerTypes.timeInterval:
			let timeInterval = DetoxUserNotificationDispatcher.value(for: DetoxUserNotificationKeys.timeInterval, in: triggerData, ofType: Double.self, context: "time interval trigger")
			trigger = UNTimeIntervalNotificationTrigger(timeInterval: timeInterval, repeats: repeats)
			break
		default: break
		}
		
		let notificationRequest = UNNotificationRequest(identifier: NSUUID().uuidString, content: notificationContent, trigger: trigger)
		
		return UNNotification(request: notificationRequest, date: Date())
	}
	
	public func userNotificationResponse(notification: UNNotification) -> UNNotificationResponse {
		
		
		let notificationResponseType : UNNotificationResponse.Type
		let userText = userNotificationData[DetoxUserNotificationKeys.userText] as? String
		
		
		if userText != nil {
			notificationResponseType = UNTextInputNotificationResponse.self
		}
		else {
			notificationResponseType = UNNotificationResponse.self
		}
		
		let rv = notificationResponseType.init(notification: notification, actionIdentifier: self.userNotificationData[DetoxUserNotificationKeys.actionIdentifier] as? String ?? UNNotificationDefaultActionIdentifier)

		if userText != nil {
			rv.setValue(userText, forKey: "userText")
		}
		
		return rv
		
	}
}

