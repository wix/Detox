//
//  RCTFakes.h
//  DetoxSyncTests
//
//  Created by asaf korem on 18/11/2021.
//  Copyright © 2021 wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Fake class of \c RCTTiming, the class that is being called by React Native when setting
/// a JS timer.
///
/// @see https://github.com/facebook/react-native/blob/main/React/CoreModules/RCTTiming.h.
@interface RCTTiming : NSObject

/// @see https://github.com/facebook/react-native/blob/ed86891d012a745606dec88295ca7551724945e9/React/CoreModules/RCTTiming.mm#L334
- (void)createTimer:(double)callbackID duration:(NSTimeInterval)jsDuration
   jsSchedulingTime:(double)jsSchedulingTime repeats:(BOOL)repeats;

@end

NS_ASSUME_NONNULL_END
