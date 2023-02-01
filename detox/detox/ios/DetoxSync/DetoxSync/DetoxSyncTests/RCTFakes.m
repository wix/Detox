//
//  RCTFakes.m
//  DetoxSyncTests
//
//  Created by asaf korem on 18/11/2021.
//  Copyright © 2021 wix. All rights reserved.
//

#import "RCTFakes.h"

@interface RCTTiming ()

@property (readwrite, nonatomic) NSMutableDictionary *timers;

@end

@implementation RCTTiming

- (void)createTimer:(double)callbackID duration:(NSTimeInterval)jsDuration
   jsSchedulingTime:(double)jsSchedulingTime repeats:(BOOL)repeats {}

@end
