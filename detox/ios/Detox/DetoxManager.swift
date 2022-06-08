//
//  DetoxManager.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 5/22/20.
//  Copyright © 2020 Wix. All rights reserved.
//

import UIKit
import DetoxSync
import LNViewHierarchyDumper

fileprivate let recordingManager : DetoxInstrumentsManager = {
	return DetoxInstrumentsManager()
}()

fileprivate let log = DetoxLog(category: "DetoxManager")

@objc(DTXDetoxManager)
public class DetoxManager : NSObject, WebSocketDelegate {
	private let webSocket : WebSocket
	private var isReady = false
	
	@objc(sharedManager)
	public static var shared : DetoxManager = {
		return DetoxManager()
	}()
	
	override init() {
		webSocket = WebSocket()
		
		super.init()
		
		webSocket.delegate = self
		
		NotificationCenter.default.addObserver(self, selector: #selector(appDidLaunch(_:)), name: UIApplication.didFinishLaunchingNotification, object: nil)
		NotificationCenter.default.addObserver(self, selector: #selector(appDidEnterBackground(_:)), name: UIApplication.didEnterBackgroundNotification, object: nil)
		
		if let recordingPath = UserDefaults.standard.string(forKey: "recordingPath") {
			var props : [String: Any] = ["recordingPath": recordingPath]
			if let _ = UserDefaults.standard.string(forKey: "samplingInterval") {
				let samplingIntervalDouble = UserDefaults.standard.double(forKey: "samplingInterval")
				props["samplingInterval"] = samplingIntervalDouble
			}
			
			self.handlePerformanceRecording(props: props, isFromLaunch: true, completionHandler: nil)
		}
	}
	
	private func safeSend(action: String, params: [String: Any] = [:], messageId: NSNumber) {
		DTXSyncManager.enqueueMainQueueIdleClosure {
			self.webSocket.sendAction(action, params: params, messageId: messageId)
		}
	}
	
	@objc
	private func appDidLaunch(_ note: Notification) {
		DTXSyncManager.enqueueMainQueueIdleClosure {
			self.isReady = true
			self.sendGeneralReadyMessage()
		}
	}
	
	@objc
	private func appDidEnterBackground(_ note: Notification) {
		var bgTask : UIBackgroundTaskIdentifier! = nil
		bgTask = UIApplication.shared.beginBackgroundTask(withName: "DetoxBackground") {
			UIApplication.shared.endBackgroundTask(bgTask)
		}
	}
	
	private func waitFor(applicationState: UIApplication.State, action: String, messageId: NSNumber) {
		var observer : NSObjectProtocol?
		
		let response : () -> Void = {
			self.safeSend(action: "\(action)Done", messageId: messageId)
			
			guard observer == nil else {
				NotificationCenter.default.removeObserver(observer!)
				observer = nil
				return
			}
		}
		
		guard UIApplication.shared.applicationState != applicationState else {
			response()
			return
		}
		
		let notificationName : NSNotification.Name
		switch  applicationState {
		case .active:
			notificationName = UIApplication.didBecomeActiveNotification
			break
		case .background:
			notificationName = UIApplication.didEnterBackgroundNotification
			break
		case .inactive:
			notificationName = UIApplication.willResignActiveNotification
		default:
			fatalError("Unknown application state \(applicationState)")
		}
		
		observer = NotificationCenter.default.addObserver(forName: notificationName, object: nil, queue: .main, using: { notification in
			DispatchQueue.main.async(execute: response)
		})
	}
	
	private func sendGeneralReadyMessage() {
		safeSend(action: "ready", messageId: -1000)
	}
	
	private func start() {
		start(synchronizationSettings: nil)
	}
	
	@objc(startWithSynchronizationSettings:)
	public func start(synchronizationSettings settings: [String: Any]?) {
		if let settings = settings {
			setSynchronizationSettings(settings, messageId: nil)
		}
		
		let options = UserDefaults.standard
		let detoxServer = options.string(forKey: "detoxTestTargetServer") ?? "ws://localhost:8797"
		let detoxSessionId = options.string(forKey: "detoxSessionId") ?? Bundle.main.bundleIdentifier!
		
		webSocket.connect(toServer: URL(string: detoxServer)!, withSessionId: detoxSessionId)
	}
	
	private func handlePerformanceRecording(props: [String: Any]?, isFromLaunch launch: Bool, completionHandler: (() -> Void)?) {
		var completionBlocked = false
		
		if let props = props, let _ = props["recordingPath"] as? String {
			if launch {
				recordingManager.continueRecording(withConfiguration: props)
			} else {
				recordingManager.startRecording(withConfiguration: props)
			}
		} else {
			completionBlocked = true
			recordingManager.stopRecording { error in
				if let error = error {
					log.error("Error while stopping recording: \(error)")
				}
				
				if let completionHandler = completionHandler {
					if Thread.isMainThread {
						completionHandler()
					} else {
						DispatchQueue.main.async {
							completionHandler()
						}
					}
				}
			}
		}
		
		if completionBlocked == false {
			completionHandler?()
		}
	}
	
	private func stopAndCleanupRecording() {
		handlePerformanceRecording(props: nil, isFromLaunch: false, completionHandler: nil)
	}

	
	@objc(notifyOnCrashWithDetails:)
	public func notifyOnCrash(details: [String: Any]) {
		log.error("App crashed: \(details["errorDetails"]!)")
		
		let semaphore = DispatchSemaphore(value: 1)
		
		recordingManager.stopRecording { error in
			semaphore.signal()
		}
		
		semaphore.wait()
		
		webSocket.sendAction("AppWillTerminateWithError", params: details, messageId: -10000)
	}
	
	private func setSynchronizationSettings(_ settings: [String: Any], messageId: NSNumber?) {
		settings.forEach { key, value in
			switch key {
			case "maxTimerWait":
				let maxTimerWait = (value as! NSNumber).doubleValue / 1000
				DTXSyncManager.maximumAllowedDelayedActionTrackingDuration = maxTimerWait
				DTXSyncManager.maximumTimerIntervalTrackingDuration = maxTimerWait
				return
			case "waitForDebugger":
				Thread.sleep(forTimeInterval: Double(truncating: value as! NSNumber) / 1000)
				return
			case "blacklistURLs":
				DTXSyncManager.urlBlacklist = value as! [String]
				DTXSyncManager.urlBlacklist = value as! [String]
				return
			case "enabled":
				DTXSyncManager.synchronizationDisabled = !((value as! NSNumber).boolValue)
				return
			default:
				log.error("Unknown synchronization setting received: \(key)")
				return
			}
		}
		
		if let messageId = messageId {
			safeSend(action: "setSyncSettingsDone", messageId: messageId)
		}
	}
	
	// MARK: WebSocketDelegate
	
	func webSocketDidConnect(_ webSocket: WebSocket) {
		if ReactNativeSupport.isReactNativeApp {
			isReady = true
			sendGeneralReadyMessage()
		}
	}
	
	func webSocket(_ webSocket: WebSocket, didFailWith error: Error) {
		log.error("Web socket failed to connect with error: \(error.localizedDescription)")
		
		DispatchQueue.main.asyncAfter(deadline: .now() + 1.0, execute: self.start)
	}
	
	func webSocket(_ webSocket: WebSocket, didReceiveAction type: String, params: [String : Any], messageId: NSNumber) {
		switch type {
			case "reloadReactNative":
				guard ReactNativeSupport.isReactNativeApp else {
					self.safeSend(action: "reactNativeDidReload", messageId: messageId)
					return
				}

				DTXSyncManager.enqueueMainQueueIdleClosure {
					ReactNativeSupport.reloadApp()
				}

				ReactNativeSupport.waitForReactNativeLoad {
					self.safeSend(action: "reactNativeDidReload", messageId: messageId)
				}

			case "waitUntilReady":
				safeSend(action: "isReady", messageId: messageId)

			case "shakeDevice":
				DTXSyncManager.enqueueMainQueueIdleClosure {
					UIDevice.dtx_shake()
					self.safeSend(action: "deviceDidShake", messageId: messageId)
				}

			case "findElementsByText":
				DTXSyncManager.enqueueMainQueueIdleClosure {
					let text = params["text"] as! String
					let predicate = NSPredicate { evaluatedObject, _ in
						guard let evaluatedObject = evaluatedObject as? NSObject else {
							return false
						}

						return evaluatedObject.dtx_text == text
					}

					let array = (UIView.dtx_findViewsInKeySceneWindows(passing: predicate) as! [UIView])
					let identifiers : [String] = array.map { $0.accessibilityIdentifier! }

					self.safeSend(
						action: "elementsDidFound",
						params: ["identifiers": identifiers],
						messageId: messageId
					)
				}

			case "requestCurrentStatus":
				DTXSyncManager.status { status in
					self.webSocket.sendAction(
						"currentStatusResult",
						params: ["messageId": messageId, "status": status],
						messageId: messageId
					)
				}

			case "setDatePicker":
				let targetIdentifier = params["elementID"] as! String
				let predicate = NSPredicate { evaluatedObject, _ in
					guard let evaluatedObject = evaluatedObject as? NSObject else {
						return false
					}

					return evaluatedObject.accessibilityIdentifier == targetIdentifier
				}

				let targetElement = (UIView.dtx_findViewsInKeySceneWindows(passing: predicate) as! [UIDatePicker]).first!
				let targetDate = params["date"] as! Date
				targetElement.setDate(targetDate, animated: true)

				self.safeSend(
					action: "didSetDatePicker",
					messageId: messageId
				)

			default:
				log.error("Unknown action type received: \(type)")
				fatalError("Unknown action type received: \(type)")
		}
	}
	
	func webSocket(_ webSocket: WebSocket, didCloseWith reason: String?) {
		if let reason = reason {
			log.error("Web socket closed with reason: \(reason)")
		} else {
			log.error("Web socket closed")
		}
		
		stopAndCleanupRecording()
		DispatchQueue.main.asyncAfter(deadline: .now() + 1.0, execute: self.start)
	}
}
