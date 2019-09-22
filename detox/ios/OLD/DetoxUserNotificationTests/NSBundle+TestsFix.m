//
//  NSBundle+TestsFix.m
//  Detox
//
//  Created by Leo Natan (Wix) on 12/02/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "NSBundle+TestsFix.h"
@import MobileCoreServices;

@interface _LSQueryResult : NSObject @end

@interface LSResourceProxy : _LSQueryResult @end

@interface LSBundleProxy : LSResourceProxy

+ (instancetype)bundleProxyForIdentifier:(NSString*)arg1;

@end

@interface LSBundleProxy (TestsFix) @end

@implementation LSBundleProxy (TestsFix)

+ (instancetype)bundleProxyForCurrentProcess
{
	return [self bundleProxyForIdentifier:@"com.apple.mobilesafari"];
}

@end

@implementation NSBundle (TestsFix)

+ (instancetype)un_applicationBundle
{
	return [NSBundle bundleForClass:NSClassFromString(@"DetoxUserNotificationDispatcher")];
}

@end

