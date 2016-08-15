//
//  ReactNativeBridgeIdlingResource.h
//  Detox
//
//  Created by Tal Kol on 8/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <EarlGrey/GREYIdlingResource.h>
#import <Foundation/Foundation.h>

@interface ReactNativeBridgeIdlingResource : NSObject<GREYIdlingResource>

+ (instancetype)idlingResourceForBridge:(id)bridge name:(NSString *)name;
+ (void)deregister:(ReactNativeBridgeIdlingResource*)instance;
- (instancetype)init NS_UNAVAILABLE;

@end
