//
//  DetoxAppDelegateProxy.h
//  Detox
//
//  Created by Leo Natan (Wix) on 19/01/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

@import Foundation;
@import UIKit;

NS_ASSUME_NONNULL_BEGIN

@interface DetoxAppDelegateProxy : NSObject <UIApplicationDelegate>

@property (class, nonatomic, strong, readonly) DetoxAppDelegateProxy* sharedAppDelegateProxy;

- (void)_dispatchUserActivityFromDataURL:(NSURL*)userActivityDataURL delayUntilActive:(BOOL)delay NS_SWIFT_NAME(dispatch(userActivityFrom:delayUntilActive:));
- (void)_dispatchUserNotificationFromDataURL:(NSURL*)userNotificationDataURL delayUntilActive:(BOOL)delay NS_SWIFT_NAME(dispatch(userNotificationFrom:delayUntilActive:));
- (void)_dispatchOpenURL:(NSURL*)URL options:(NSDictionary*)options delayUntilActive:(BOOL)delay NS_SWIFT_NAME(dispatch(openURL:options:delayUntilActive:));

@end

NS_ASSUME_NONNULL_END
