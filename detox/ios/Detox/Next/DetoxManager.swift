//
//  DetoxManager.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 5/22/20.
//  Copyright © 2020 Wix. All rights reserved.
//

import UIKit
import EarlGrey

fileprivate let recordingManager : DetoxInstrumentsManager = {
	return DetoxInstrumentsManager()
}()

fileprivate func EarlGrey(file: String = #file, lineNumber: Int = #line) -> EarlGreyImpl {
	return EarlGreyImpl.invoked(fromFile: file, lineNumber: UInt(lineNumber))
}

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
		EarlGrey().detox_safeExecuteSync {
			self.webSocket.sendAction(action, params: params, messageId: messageId)
		}
	}
	
	@objc
	private func appDidLaunch(_ note: Notification) {
		EarlGrey().detox_safeExecuteSync {
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
		GREYConfiguration.sharedInstance().setValue(false, forConfigKey: kGREYConfigKeyAnalyticsEnabled)
		
		if let settings = settings {
			setSynchronizationSettings(settings, messageId: nil)
		}
		
		let options = UserDefaults.standard
		let detoxServer = options.string(forKey: "detoxServer") ?? "ws://localhost:8099"
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
				
				completionHandler?()
			}
		}
		
		if completionBlocked == false {
			completionHandler?()
		}
	}
	
	private func stopAndCleanupRecording() {
		handlePerformanceRecording(props: nil, isFromLaunch: false, completionHandler: nil)
	}
	
	private func waitForRNLoad(withMessageId messageId: NSNumber) {
		ReactNativeSupport.waitForReactNativeLoad {
			self.isReady = true
			self.sendGeneralReadyMessage()
		}
	}
	
	@objc(notifyOnCrashWithDetails:)
	public func notifyOnCrash(details: [String: Any]) {
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
			case "waitForDebugger":
				usleep((value as! NSNumber).uint32Value * 1000)
				return
			case "blacklistURLs":
				GREYConfiguration.sharedInstance().setValue(value, forConfigKey: kGREYConfigKeyURLBlacklistRegex)
				return
			case "enabled":
				GREYConfiguration.sharedInstance().setValue((value as! NSNumber).boolValue, forConfigKey: kGREYConfigKeySynchronizationEnabled)
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
		let done = "\(type)Done"
		
		switch type {
		case "testerDisconnected":
			stopAndCleanupRecording()
			return
		case "setRecordingState":
			handlePerformanceRecording(props: params, isFromLaunch: false) {
				self.safeSend(action: done, messageId: messageId)
			}
			return
		case "waitForActive":
			waitFor(applicationState: .active, action: type, messageId: messageId)
			return
		case "waitForBackground":
			waitFor(applicationState: .background, action: type, messageId: messageId)
			return
		case "waitForIdle":
			safeSend(action: done, messageId: messageId)
			return
		case "setSyncSettings":
			setSynchronizationSettings(params, messageId: messageId)
			return
		case "invoke":
			EarlGrey().detox_safeExecuteSync {
				InvocationManager.invoke(dictionaryRepresentation: params) { result, error in
					if let error = error {
						self.safeSend(action: "testFailed", params: ["details": error.localizedDescription], messageId: messageId)
					} else {
						self.safeSend(action: "invokeResult", params: result ?? [:], messageId: messageId)
					}
				}
			}
			return
		case "isReady":
			if isReady {
				sendGeneralReadyMessage()
			}
			return
		case "cleanup":
			self.webSocket.sendAction(done, params: [:], messageId: messageId)
			return
		case "deliverPayload":
			let delay = (params["delayPayload"] as? Bool) ?? false
			
			let closure : () -> Void
			let sendDoneAction : () -> Void = {
				self.safeSend(action: done, messageId: messageId)
			}
			
			if let urlParam = params["url"] as? String {
				guard let urlToOpen = URL(string: urlParam) else {
					fatalError("Invalid URL")
				}
				
				var options : [UIApplication.LaunchOptionsKey: Any] = [UIApplication.LaunchOptionsKey.url: urlToOpen]
				if let sourceApp = params["sourceApp"] as? String {
					options[UIApplication.LaunchOptionsKey.sourceApplication] = sourceApp
				}
				
				closure = {
					DetoxAppDelegateProxy.shared.dispatch(openURL: urlToOpen, options: options, delayUntilActive: delay)
				}
				
				sendDoneAction()
			} else if let notificationParam = params["detoxUserNotificationDataURL"] as? String {
				let userNotificationDataURL = URL(fileURLWithPath: notificationParam)
				
				closure = {
					DetoxAppDelegateProxy.shared.dispatch(userNotificationFrom: userNotificationDataURL, delayUntilActive: delay)
				}
				
				sendDoneAction()
			} else if let activityParam = params["detoxUserActivityDataURL"] as? String {
				let userActivityDataURL = URL(fileURLWithPath: activityParam)
				
				closure = {
					DetoxAppDelegateProxy.shared.dispatch(userActivityFrom: userActivityDataURL, delayUntilActive: delay)
				}
				
				sendDoneAction()
			}
			else
			{
				fatalError("Unknown payload received")
			}
			
			guard delay == false else {
				closure()
				return
			}
			
			EarlGrey().detox_safeExecuteSync(closure)
			return
		case "setOrientation":
			let orientationString = params["orientation"] as! String
			let orientation : UIDeviceOrientation
			switch orientationString {
			case "portrait":
				orientation = .portrait
				break
			case "landscape":
				orientation = .landscapeRight
				break
			default:
				fatalError("Unknown orientation provided: \(orientationString)")
			}
			
			EarlGrey().detox_safeExecuteSync {
				UIDevice.dtx_setOrientation(orientation)
				
				self.safeSend(action: done, messageId: messageId)
			}
			return
		case "shakeDevice":
			EarlGrey().detox_safeExecuteSync {
				UIDevice.dtx_shake()
				
				self.safeSend(action: done, messageId: messageId)
			}
			return
		case "reactNativeReload":
			isReady = false
			EarlGrey().detox_safeExecuteSync {
				ReactNativeSupport.reloadApp()
			}
			waitForRNLoad(withMessageId: messageId)
			return
		case "currentStatus":
			var stats = EarlGreyStatistics.shared.currentStatus()
			stats["messageId"] = messageId
			
			self.webSocket.sendAction("currentStatusResult", params: stats, messageId: messageId)
			return
		case "loginSuccess":
			log.info("Successfully logged in")
			return
		default:
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
