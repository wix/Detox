//
//  ReactNativeSupport.m
//  Detox
//
//  Created by Tal Kol on 6/28/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "ReactNativeSupport.h"
#import "ReactNativeBridgeIdlingResource.h"
#import "ReactNativeUIManagerIdlingResource.h"

@interface ReactNativeSupport()

@property (nonatomic, assign) BOOL javascriptJustLoaded;
@property (nonatomic, retain) ReactNativeBridgeIdlingResource *bridgeIdlingResource;
@property (nonatomic, retain) ReactNativeUIManagerIdlingResource *uiManagerIdlingResource;

@end


@implementation ReactNativeSupport

NSString *const RCTReloadNotification = @"RCTReloadNotification";
NSString *const RCTJavaScriptDidLoadNotification = @"RCTJavaScriptDidLoadNotification";
NSString *const RCTContentDidAppearNotification = @"RCTContentDidAppearNotification";


- (instancetype)init
{
    self = [super init];
    if (self == nil) return nil;
    self.javascriptJustLoaded = NO;
    self.bridgeIdlingResource = nil;
    self.uiManagerIdlingResource = nil;
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(javascriptDidLoad)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(contentDidAppear)
                                                 name:RCTContentDidAppearNotification
                                               object:nil];
    
    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (BOOL) isReactNativeApp
{
    return (NSClassFromString(@"RCTBridge") != nil);
}

- (void) reloadApp
{
    [self removeIdlingResources];
    
    // option 1: [[RCTBridge currentBridge] reload]
    
    // option 2: post notification
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification
                                                        object:nil
                                                      userInfo:nil];
}

- (void) javascriptDidLoad
{
    self.javascriptJustLoaded = YES;
 
    // install idling resources to help earlgrey sync with react native
    [self removeIdlingResources];
    self.bridgeIdlingResource = [ReactNativeBridgeIdlingResource idlingResourceForBridge:nil name:@"ReactNative Bridge"];
    self.uiManagerIdlingResource = [ReactNativeUIManagerIdlingResource idlingResourceForBridge:nil name:@"ReactNative UIManager"];
}

- (void) contentDidAppear
{
    if (self.javascriptJustLoaded)
    {
        self.javascriptJustLoaded = NO;
        if (self.delegate) [self.delegate reactNativeAppDidLoad];
    }
}

- (void) removeIdlingResources
{
    if (self.bridgeIdlingResource != nil)
    {
        [ReactNativeBridgeIdlingResource deregister:self.bridgeIdlingResource];
        self.bridgeIdlingResource = nil;
    }
    if (self.uiManagerIdlingResource != nil)
    {
        [ReactNativeUIManagerIdlingResource deregister:self.uiManagerIdlingResource];
        self.uiManagerIdlingResource = nil;
    }
}

@end
