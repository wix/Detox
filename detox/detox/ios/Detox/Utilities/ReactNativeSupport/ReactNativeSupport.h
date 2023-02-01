//
//  ReactNativeSupport.h
//  Detox
//
//  Created by Tal Kol on 6/28/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface ReactNativeSupport : NSObject

@property (nonatomic, class, readonly) BOOL isReactNativeApp;

+ (void)reloadApp;
+ (void)waitForReactNativeLoadWithCompletionHandler:(void(^)(void))handler;

@end

