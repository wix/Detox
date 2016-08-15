//
//  ReactNativeUIManagerIdlingResource.h
//  Detox
//
//  Created by Tal Kol on 8/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <EarlGrey/GREYIdlingResource.h>
#import <EarlGrey/GREYDispatchQueueIdlingResource.h>

@interface ReactNativeUIManagerIdlingResource : GREYDispatchQueueIdlingResource

+ (instancetype)idlingResourceForBridge:(id)bridge name:(NSString *)name;
+ (void)deregister:(ReactNativeUIManagerIdlingResource*)instance;
- (instancetype)init NS_UNAVAILABLE;

@end
