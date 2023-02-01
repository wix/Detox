//
//  DTXTimerSyncResource.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/28/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXSyncResource.h"
#import <QuartzCore/QuartzCore.h>


NS_ASSUME_NONNULL_BEGIN

@protocol DTXTimerProxy <NSObject>

@property (nonatomic, strong) NSString* name;

@property (nonatomic, strong) NSDate* fireDate;
@property (nonatomic, assign) NSTimeInterval interval;
@property (nonatomic, assign) BOOL repeats;

//NSTimer
@property (nonatomic, weak) NSTimer* timer;
- (void)fire:(NSTimer*)timer;
@property (nonatomic) CFRunLoopRef runLoop;

//CADisplayLink
@property (nonatomic, weak) CADisplayLink* displayLink;

- (void)track;
- (void)untrack;

#if DEBUG
- (NSString*)history;
#endif

@end

@interface DTXTimerSyncResource : DTXSyncResource

+ (id<DTXTimerProxy>)timerProxyWithTarget:(id)target selector:(SEL)selector fireDate:(NSDate*)fireDate interval:(NSTimeInterval)ti repeats:(BOOL)rep;
+ (id<DTXTimerProxy>)timerProxyWithCallback:(CFRunLoopTimerCallBack)callback fireDate:(NSDate*)fireDate interval:(NSTimeInterval)ti repeats:(BOOL)rep;
+ (id<DTXTimerProxy>)existingTimerProxyWithTimer:(NSTimer*)timer;
+ (void)clearExistingTimerProxyWithTimer:(NSTimer*)timer;

+ (id<DTXTimerProxy>)existingTimerProxyWithDisplayLink:(CADisplayLink *)displayLink create:(BOOL)create;
+ (void)clearExistingTimerProxyWithDisplayLink:(CADisplayLink*)displayLink;

@end

NS_ASSUME_NONNULL_END
