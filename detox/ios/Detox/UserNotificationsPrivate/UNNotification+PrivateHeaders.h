//
//  UNNotification+PrivateHeaders.h
//  Detox
//
//  Created by Leo Natan (Wix) on 26/01/2017.
//  Copyright © 2017 Leo Natan. All rights reserved.
//

@import UserNotifications;

NS_ASSUME_NONNULL_BEGIN

@interface UNNotification ()

+ (instancetype)notificationWithRequest:(UNNotificationRequest*)arg1 date:(NSDate*)arg2;

@end

NS_ASSUME_NONNULL_END
