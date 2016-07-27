//
//  ReactNativeSupport.m
//  Detox
//
//  Created by Tal Kol on 6/28/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "ReactNativeSupport.h"

@implementation ReactNativeSupport

NSString *const RCTReloadNotification = @"RCTReloadNotification";
NSString *const RCTJavaScriptDidLoadNotification = @"RCTJavaScriptDidLoadNotification";

- (instancetype)init
{
    self = [super init];
    if (self == nil) return nil;
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(appDidLoad)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:nil];
    
    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void) reloadApp
{
    // option 1: [[RCTBridge currentBridge] reload]
    
    // option 2: post notification
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification
                                                        object:nil
                                                      userInfo:nil];
}

- (void) appDidLoad
{
    if (self.delegate) [self.delegate reactNativeAppDidLoad];
}


@end
