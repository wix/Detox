//
//  DetoxIPCAPI.h
//  Detox
//
//  Created by Leo Natan (Wix) on 9/18/19.
//

NS_ASSUME_NONNULL_BEGIN

#ifndef DetoxHelperAPI_h
#define DetoxHelperAPI_h

@import UIKit;

@protocol DetoxTestRunner <NSObject>

- (void)notifyOnCrashWithDetails:(NSDictionary*)details;
- (void)getLaunchArgumentsWithCompletionHandler:(void (^)(NSUInteger waitForDebugger, NSURL* _Nullable recordingPath, NSDictionary<NSString*, id>* _Nullable userNotificationData, NSDictionary<NSString*, id>* _Nullable userActivityData, NSURL* _Nullable openURL, NSString* _Nullable sourceApp))completionHandler;

@end

@protocol DetoxHelper <NSObject>

- (void)beginDelayingTimePickerEvents;
- (void)endDelayingTimePickerEventsWithCompletionHandler:(nullable dispatch_block_t)completionHandler;

- (void)waitForIdleWithCompletionHandler:(dispatch_block_t)completionHandler;
- (void)syncStatusWithCompletionHandler:(void (^)(NSString* information))completionHandler;
- (void)waitForApplicationState:(UIApplicationState)applicationState completionHandler:(dispatch_block_t)completionHandler;

- (void)deliverPayload:(NSDictionary*)payload completionHandler:(dispatch_block_t)completionHandler;

- (void)handlePerformanceRecording:(nullable NSDictionary*)props isFromLaunch:(BOOL)launch completionHandler:(nullable dispatch_block_t)completionHandler;
- (void)stopAndCleanupRecordingWithCompletionHandler:(dispatch_block_t)completionHandler;

- (void)reloadReactNativeWithCompletionHandler:(dispatch_block_t)completionHandler;

- (void)isDebuggerAttachedWithCompletionHandler:(void(^)(BOOL isDebuggerAttached))completionHandler;

@end

#endif /* DetoxHelperAPI_h */

NS_ASSUME_NONNULL_END
