//
//  UIApplication+MockedSharedApplication.h
//  DetoxUserNotificationTests
//
//  Created by Leo Natan (Wix) on 7/11/19.
//  Copyright © 2019 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

extern void DTXApplicationMock(NSString * _Nullable principalClassName, NSString * _Nullable delegateClassName);

@interface UIApplication (MockedSharedApplication)

@property(nonatomic,readwrite) UIApplicationState applicationState;

@end
