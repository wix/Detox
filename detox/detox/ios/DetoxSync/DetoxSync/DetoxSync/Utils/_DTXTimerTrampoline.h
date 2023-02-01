//
//  _DTXTimerTrampoline.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/9/20.
//  Copyright © 2020 wix. All rights reserved.
//

#import "DTXTimerSyncResource.h"

extern const void* __DTXTimerTrampolineKey;

@interface _DTXTimerTrampoline : NSObject <DTXTimerProxy>

- (instancetype)initWithTarget:(id)target selector:(SEL)selector fireDate:(NSDate*)fireDate interval:(NSTimeInterval)ti repeats:(BOOL)rep;
- (instancetype)initWithCallback:(CFRunLoopTimerCallBack)callback fireDate:(NSDate*)fireDate interval:(NSTimeInterval)ti repeats:(BOOL)rep;

- (BOOL)isDead;

/// Returns a JSON dictionary that describes the timer.
- (DTXBusyResource *)jsonDescription;

@end
