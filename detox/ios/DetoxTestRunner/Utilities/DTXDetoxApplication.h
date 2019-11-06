//
//  DTXDetoxApplication.h
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 9/22/19.
//

#import <XCTest/XCTest.h>
#import "DetoxIPCAPI.h"

NS_ASSUME_NONNULL_BEGIN

@class DTXDetoxApplication;

@protocol DTXDetoxApplicationDelegate <NSObject>

- (void)application:(DTXDetoxApplication*)application didCrashWithDetails:(NSDictionary*)details;

@end

@interface DTXDetoxApplication : XCUIApplication

@property (nonatomic, weak) id<DTXDetoxApplicationDelegate> delegate;
@property (nonatomic, strong, readonly) id<DetoxHelper> detoxHelper;

@property (nonatomic) NSUInteger launchWaitForDebugger;
@property (nonatomic, strong, nullable) NSURL* launchRecordingPath;
@property (nonatomic, strong, nullable) NSDictionary* launchUserNotification;
@property (nonatomic, strong, nullable) NSDictionary* launchUserActivity;
@property (nonatomic, strong, nullable) NSURL* launchOpenURL;
@property (nonatomic, strong, nullable) NSString* launchSourceApp;

- (BOOL)waitForIdleWithTimeout:(NSTimeInterval)timeout;

@end

NS_ASSUME_NONNULL_END
