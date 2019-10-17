//
//  DetoxUserActivityDispatcher.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 3/15/18.
//  Copyright © 2018 Wix. All rights reserved.
//

import UIKit

@objc(DetoxUserActivityDispatcher)
public class DetoxUserActivityDispatcher: NSObject {
	@objc let userActivityData : [String: Any]
	
	@objc(initWithUserActivityData:)
	public init(userActivityData: [String: Any]) {
		self.userActivityData = userActivityData
		
		super.init()
	}
	
	@objc public private(set) lazy var userActivity: NSUserActivity = {
		guard let activityType = self.userActivityData[DetoxUserActivityKeys.activityType] as? String, activityType.count > 0 else {
			Swift.fatalError("Missing or invalid activity type")
		}
		
		let rv = NSUserActivity(activityType: activityType)
		
		self.userActivityData.forEach {
			guard $0 != "activityType" else {
				return
			}
			
			var value : Any = $1
			if $0 == "referrerURL" || $0 == "webpageURL" {
				value = URL(string: $1 as! String)!
			}
			
			rv.setValue(value, forKey: $0)
		}
		
		return rv
	}()
	
	@objc(dispatchOnAppDelegate:)
	public func dispatch(on appDelegate: UIApplicationDelegate) {
		let userActivity = self.userActivity
		
		_ = appDelegate.application?(UIApplication.shared, willContinueUserActivityWithType: userActivity.activityType)
		_ = appDelegate.application?(UIApplication.shared, continue: userActivity) { objects in }
	}
}
