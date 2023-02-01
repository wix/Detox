//
//  DTXSyncManagerSpecHelpers.m
//  DetoxSyncTests
//
//  Created by asaf korem on 18/11/2021.
//  Copyright © 2021 wix. All rights reserved.
//

#import "DTXSyncManagerSpecHelpers.h"

#import <DetoxSync/DTXSyncManager.h>

#import "DTXJSTimerSyncResource.h"
#import "NSString+SyncResource.h"
#import "NSString+SyncStatus.h"
#import "RCTFakes.h"
#import "NSArray+Functional.h"
#import "NSDictionary+Functional.h"

@interface DTXSyncManager (ForTesting)

+ (void)registerSyncResource:(DTXSyncResource*)syncResource;

@end

@implementation NSDictionary (RoundedTimer)

- (NSDictionary<NSString *,id> *)roundedTimerValue {
  return [self map:^id(NSString *key, id value) {
    if ([key isEqualToString:@"time_until_fire"]) {
      return @(floorf([value floatValue] + 0.5f));
    }

    return value;
  }];
}

@end

@implementation NSDictionary (SyncStatus)

- (DTXBusyResources *)busyResourcesWithName:(NSString *)name {
  DTXBusyResources * busyResources = self[NSString.dtx_busyResourcesKey];
  return [busyResources filter:^BOOL(DTXBusyResource *resource) {
    return [resource[NSString.dtx_resourceNameKey] isEqualToString:name];
  }];
}

@end

DTXSyncStatus *DTXAwaitStatus(void) {
  __block NSDictionary<NSString *,id> * _Nullable syncStatus;
  waitUntil(^(DoneCallback done) {
    [DTXSyncManager statusWithCompletionHandler:^(NSDictionary<NSString *,id> *status) {
      syncStatus = status;
      done();
    }];
  });

  assert(syncStatus);
  return syncStatus;
}

NSDateFormatter *DTXDateFormatter(void) {
  NSDateFormatter* formatter = [NSDateFormatter new];
  [formatter setTimeZone:[NSTimeZone systemTimeZone]];
  [formatter setLocale:[NSLocale currentLocale]];
  [formatter setDateFormat:@"YYYY-MM-dd HH:mm:ss Z"];

  return formatter;
}

NSArray<NSDictionary<NSString *,id> *> *DTXMapTimers(NSArray<NSDictionary<NSString *,id> *> *timers) {
  return [timers map:^NSDictionary<NSString *,id> *(NSDictionary<NSString *,id> *timer) {
    return timer.roundedTimerValue;
  }];
}

void DTXConnectWithJSTimerSyncResource(void) {
  DTXJSTimerSyncResource* resource = [DTXJSTimerSyncResource new];
  [DTXSyncManager registerSyncResource:resource];
}

void DTXCreateFakeJSTimer(double callbackID, NSTimeInterval duration, double schedulingTime,
                          BOOL repeats) {
  RCTTiming *fakeTiming = [[RCTTiming alloc] init];
  [fakeTiming createTimer:callbackID duration:duration jsSchedulingTime:schedulingTime repeats:repeats];
}

void DTXRegisterSingleEvent(NSString *event, NSString * _Nullable object) {
  id trackEvent = [DTXSyncManager trackEventWithDescription:event objectDescription:object];
  [DTXSyncManager registerSyncResource:trackEvent];
}

void DTXPerformSelectorAfterDelay(void) {
  NSNumber *dummyObject = @1;
  SEL dummySelector = @selector(floatValue);
  [dummyObject performSelector:dummySelector withObject:nil afterDelay:20];
}

void DTXDispatcSyncOnArbitraryQueue(void (^block)(void)) {
  static dispatch_queue_t dummyQueue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dummyQueue = dispatch_queue_create("foo", 0);
    [DTXSyncManager trackDispatchQueue:dummyQueue name:@"bar"];
  });

  dispatch_sync(dummyQueue, ^{
    block();
  });
}

NSString *DTXScheduleTimer(BOOL shouldRepeat, NSTimeInterval interval) {
  NSTimer *dummyTimer = [NSTimer scheduledTimerWithTimeInterval:interval repeats:shouldRepeat
                                                          block:^(NSTimer * __unused timer) {}];
  return [DTXDateFormatter() stringFromDate:dummyTimer.fireDate];
}

CFRunLoopRef DTXExecuteOnArbitraryThread(void (^block)(void)) {
  __block NSRunLoop * _Nullable runLoop;
  __block NSThread * _Nullable thread;

  waitUntil(^(DoneCallback done) {
    thread = [[NSThread alloc] initWithBlock:^{
      runLoop = [NSRunLoop currentRunLoop];
      [DTXSyncManager trackRunLoop:runLoop name:@"foo"];
      block();
      done();
    }];
    [thread start];
  });

  [thread cancel];

  return [runLoop getCFRunLoop];
}

UIViewController *DTXCreateDummyViewController(void) {
  UIViewController *controller = OCMPartialMock([[UIViewController alloc] init]);

  id <UIViewControllerTransitionCoordinator> coordinator =
      OCMProtocolMock(@protocol(UIViewControllerTransitionCoordinator));
  OCMStub([controller transitionCoordinator]).andReturn(coordinator);

  return controller;
}
