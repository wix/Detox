//
//  NSBundle+TestsFix.m
//  Detox
//
//  Created by Leo Natan (Wix) on 12/02/2017.
//  Copyright © 2017 Leo Natan. All rights reserved.
//

#import "NSBundle+TestsFix.h"

@implementation NSBundle (TestsFix)

+ (instancetype)un_applicationBundle
{
	return [NSBundle bundleForClass:NSClassFromString(@"DetoxUserNotificationDispatcher")];
}

@end

