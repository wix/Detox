//
//  DetoxReactNativeBridge.m
//  Detox
//
//  Created by Mark de Vocht (Wix) on 28/09/2025.
//  Copyright © 2025 Wix. All rights reserved.
//

#import "DetoxSwiftBridge.h"
@import UIKit;

DTX_CREATE_LOG(ReactNativeBridge);

static NSObject<DetoxReactNativeBridgeProtocol> *_registeredSwiftAppDelegate = nil;

@implementation DetoxSwiftBridge

+ (void)registerSwiftAppDelegate:(NSObject<DetoxReactNativeBridgeProtocol> *)appDelegate
{
    if (appDelegate == nil) {
        dtx_log_error(@"Cannot register nil Swift AppDelegate");
        return;
    }
    
    if (![appDelegate conformsToProtocol:@protocol(DetoxReactNativeBridgeProtocol)]) {
        dtx_log_error(@"Swift AppDelegate must implement DetoxReactNativeBridgeProtocol");
        return;
    }
    
    _registeredSwiftAppDelegate = appDelegate;
    dtx_log_info(@"Registered Swift AppDelegate: %@", NSStringFromClass([appDelegate class]));
}

+ (nullable NSObject *)getReactNativeFactory
{
    if (_registeredSwiftAppDelegate == nil) {
        return nil;
    }
    
    @try {
        return [_registeredSwiftAppDelegate detoxReactNativeFactory];
    } @catch (NSException *exception) {
        dtx_log_error(@"Failed to get React Native factory from Swift AppDelegate: %@", exception.reason);
        return nil;
    }
}

+ (nullable NSObject *)getRootViewFactory
{
    if (_registeredSwiftAppDelegate == nil) {
        return nil;
    }
    
    if ([_registeredSwiftAppDelegate respondsToSelector:@selector(detoxRootViewFactory)]) {
        @try {
            return [_registeredSwiftAppDelegate detoxRootViewFactory];
        } @catch (NSException *exception) {
            dtx_log_error(@"Failed to get root view factory directly from Swift AppDelegate: %@", exception.reason);
        }
    }
    
    NSObject *reactNativeFactory = [self getReactNativeFactory];
    if (reactNativeFactory == nil) {
        return nil;
    }
    
    @try {
        return [reactNativeFactory valueForKey:@"rootViewFactory"];
    } @catch (NSException *exception) {
        dtx_log_error(@"Failed to get root view factory from React Native factory: %@", exception.reason);
        return nil;
    }
}

@end
