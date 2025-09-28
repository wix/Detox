//
//  DetoxSwiftBridge.h
//  Detox
//
//  Created by Mark de Vocht (Wix) on 28/09/2025.
//  Copyright © 2025 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol DetoxReactNativeBridgeProtocol <NSObject>
- (nullable NSObject *)detoxReactNativeFactory;
@optional
- (nullable NSObject *)detoxRootViewFactory;
@end


@interface DetoxSwiftBridge : NSObject
+ (void)registerSwiftAppDelegate:(NSObject<DetoxReactNativeBridgeProtocol> *)appDelegate;
+ (nullable NSObject *)getReactNativeFactory;
+ (nullable NSObject *)getRootViewFactory;
@end

NS_ASSUME_NONNULL_END
