//
//  UNNotificationResponse+PrivateHeaders.h
//  Detox
//
//  Created by Leo Natan (Wix) on 26/01/2017.
//  Copyright © 2017 Leo Natan. All rights reserved.
//

@import UserNotifications;

NS_ASSUME_NONNULL_BEGIN

@interface UNNotificationResponse ()

+ (instancetype)responseWithNotification:(UNNotification*)arg1 actionIdentifier:(NSString*)arg2;

@end

NS_ASSUME_NONNULL_END
