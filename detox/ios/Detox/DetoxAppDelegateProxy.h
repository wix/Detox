//
//  DetoxAppDelegateProxy.h
//  Detox
//
//  Created by Leo Natan (Wix) on 19/01/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

@import Foundation;
@import UIKit;

@interface DetoxAppDelegateProxy : NSObject <UIApplicationDelegate>

@property (class, nonatomic, strong, readonly) DetoxAppDelegateProxy* currentAppDelegateProxy;

- (void)dispatchUserNotificationFromDataURL:(NSURL*)userNotificationDataURL delayUntilActive:(BOOL)delay;
- (void)dispatchOpenURL:(NSURL*)URL options:(NSDictionary*)options delayUntilActive:(BOOL)delay;

@end
