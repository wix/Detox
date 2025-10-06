//
//  DetoxSwiftBridge.h
//  Detox
//
//  Created by Mark de Vocht on 28/09/2025.
//  Copyright © 2025 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface DetoxSwiftBridge : NSObject
+ (nullable NSObject *)getRootViewFactory;
+ (nullable NSObject *)getReactNativeFactory;
@end

NS_ASSUME_NONNULL_END
