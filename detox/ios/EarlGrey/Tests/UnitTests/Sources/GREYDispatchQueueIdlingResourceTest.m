//
// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import <EarlGrey/GREYConfiguration.h>
#import <EarlGrey/GREYDispatchQueueIdlingResource.h>

#import "GREYBaseTest.h"

static const int kMaxAggresiveCalls = 100;

@interface GREYDispatchQueueIdlingResourceTest : GREYBaseTest
@end

@implementation GREYDispatchQueueIdlingResourceTest  {
  dispatch_queue_t _serialQueue;
}

- (void)setUp {
  [super setUp];
  _serialQueue = dispatch_queue_create("SerialQForIdlingResourceTest", DISPATCH_QUEUE_SERIAL);
}

- (void)tearDown {
  [[GREYConfiguration sharedInstance] reset];
  [super tearDown];
}

- (void)testQueueName {
  NSString *queueName = @"queueName";

  [[GREYConfiguration sharedInstance] setValue:@(1.0)
                                  forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                            name:queueName];
  XCTAssertEqual(queueName, [idlingRes idlingResourceName], @"Name differs");
}

- (void)testIsInitiallyIdle {
  [[GREYConfiguration sharedInstance] setValue:@(1.0)
                                  forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                            name:@"test"];
  XCTAssertTrue([idlingRes isIdleNow], @"Empty queue should be in idle state.");
}

- (void)testAggresiveCallingIsIdleNowOnBackgroundThead {
  [[GREYConfiguration sharedInstance] setValue:@(1.0)
                                  forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                            name:@"test"];
  // We must verify that sending isIdleNow message itself does not make the queue busy.
  for (int i = 0; i < kMaxAggresiveCalls; i++) {
    [idlingRes isIdleNow];
  }

  XCTAssertTrue([idlingRes isIdleNow], @"Empty queue should be in idle state.");
}

- (void)testOccupiedQueueNotIdle {
  [[GREYConfiguration sharedInstance] setValue:@(1.0)
                                  forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                            name:@"test"];
  NSLock *lock = [[NSLock alloc] init];
  [lock lock];
  dispatch_async(_serialQueue, ^{
    [lock lock];
    [lock unlock];
  });
  XCTAssertFalse([idlingRes isIdleNow], @"Non-empty queue should not be in idle state.");
  [lock unlock];
}

- (void)testMainQueueIdle {
  dispatch_queue_t mainQ = dispatch_get_main_queue();
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource grey_resourceForCurrentlyTrackedDispatchQueue:mainQ];
  XCTAssertTrue([idlingRes isIdleNow], @"Main queue must be idle.");
}

- (void)testIsIdleNowDoesNotAffectMainQueue {
  dispatch_queue_t mainQ = dispatch_get_main_queue();
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource grey_resourceForCurrentlyTrackedDispatchQueue:mainQ];
  // We must verify that sending isIdleNow message itself does not make main queue busy.
  for (int i = 0; i < kMaxAggresiveCalls; i++) {
    [idlingRes isIdleNow];
  }

  XCTAssertTrue([idlingRes isIdleNow], @"Main queue must be idle.");
}

- (void)testMainQueueNotIdle {
  dispatch_queue_t mainQ = dispatch_get_main_queue();
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource grey_resourceForCurrentlyTrackedDispatchQueue:mainQ];
  dispatch_async(dispatch_get_main_queue(), ^{});
  XCTAssertFalse([idlingRes isIdleNow], @"Main queue must not be idle.");
}

- (void)testOccupiedQueueIdleAfterTaskCompletion {
  double trackableValue = 0.1;
  [[GREYConfiguration sharedInstance] setValue:@(trackableValue)
                                  forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                            name:@"test"];
  NSConditionLock *syncLock = [[NSConditionLock alloc] init];
  [syncLock lockWhenCondition:0];
  dispatch_async(_serialQueue, ^{
    // Wait for isIdle evaluation to occur.
    [syncLock lockWhenCondition:1];
    int64_t time = (int64_t)(trackableValue * NSEC_PER_SEC);
    // dispatch_after isn't going to be tracked because the time is less than the min-trackable
    // amount. Leaving the group in this manner ensures that the idling resource idles right after.
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, time), _serialQueue, ^{
      [syncLock unlockWithCondition:2];
    });
  });
  XCTAssertFalse([idlingRes isIdleNow], @"Non-empty queue should not be in idle state.");
  [syncLock unlockWithCondition:1];

  // Wait for queue to empty.
  [syncLock lockWhenCondition:2];
  XCTAssertTrue([idlingRes isIdleNow], @"Queue should be idle after executing the only task.");
  [syncLock unlock];
}

- (void)testIdlingResourceDoesNotTrackDispatchAfterBlock {
  double trackableValue = 0.05;
  [[GREYConfiguration sharedInstance] setValue:@(trackableValue)
                                  forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                            name:@"test"];

  NSConditionLock *conditionLock = [[NSConditionLock alloc] initWithCondition:0];
  [conditionLock lock];
  __block BOOL executed = NO;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * trackableValue * NSEC_PER_SEC)),
                 _serialQueue, ^{
    [conditionLock lockWhenCondition:1];
    executed = YES;
    [conditionLock unlockWithCondition:2];
  });
  XCTAssertFalse(executed, @"Block should be pending execution");
  XCTAssertTrue([idlingRes isIdleNow], @"Idling resource should not track block with large delay");
  [conditionLock unlockWithCondition:1];

  [conditionLock lockWhenCondition:2];
  XCTAssertTrue(executed, @"Block should still be be executed even if dispatch_after isn'ttracked");
  XCTAssertTrue([idlingRes isIdleNow], @"Idling resource should be idle after block execution");
  [conditionLock unlock];
}

- (void)testIdlingResourceTracksDispatchAfterBlock {
  double trackableValue = 0.05;
  [[GREYConfiguration sharedInstance] setValue:@(trackableValue)
                                  forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                            name:@"test"];
  __block BOOL executed = NO;
  NSConditionLock *syncLock = [[NSConditionLock alloc] init];
  [syncLock lockWhenCondition:0];
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.05 * NSEC_PER_SEC)),
                 _serialQueue, ^{
    [syncLock lockWhenCondition:1];
    executed = YES;
    [syncLock unlockWithCondition:2];
  });
  XCTAssertFalse(executed, @"Block should be pending execution");
  XCTAssertFalse([idlingRes isIdleNow], @"Idling resource should track block with small delay");
  [syncLock unlockWithCondition:1];

  [syncLock lockWhenCondition:2];
  XCTAssertTrue(executed, @"Block should be been executed");
  XCTAssertTrue([idlingRes isIdleNow], @"Idling resource should be idle after finishing execution");
  [syncLock unlock];
}

- (void)testIdlingResourceTracksDispatchAsyncBlock {
  double trackableValue = 0.05;
  [[GREYConfiguration sharedInstance] setValue:@(trackableValue)
                                  forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                            name:@"test"];
  __block BOOL executed = NO;

  NSLock *lock = [[NSLock alloc] init];
  [lock lock];

  dispatch_semaphore_t sem = dispatch_semaphore_create(0);
  dispatch_async(_serialQueue, ^{
    // Wait for preliminary assertions to be checked first. This lock will be unlocked rightafter.
    [lock lock];
    [lock unlock];

    XCTAssertFalse([idlingRes isIdleNow], @"Idling resource should track dispatch async block");
    executed = YES;
    // This is to prevent a race condition that causes _serialQueue's pending count
    // to be decremented after test has finished execution, causing the last isIdleNow check
    // to fail.
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * trackableValue * NSEC_PER_SEC)),
                   _serialQueue, ^{
      dispatch_semaphore_signal(sem);
    });
  });

  XCTAssertFalse(executed, @"Block should be pending execution");
  XCTAssertFalse([idlingRes isIdleNow], @"Idling resource should track dispatch async block");
  [lock unlock];

  // Wait for async block to finish execution.
  dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);
  XCTAssertTrue([idlingRes isIdleNow], @"Idling resource should be idle after finishing execution");
}

- (void)testIdlingResourceTracksDispatchSyncBlock {
  [[GREYConfiguration sharedInstance] setValue:@(0.5)
                                  forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                            name:@"test"];
  __block BOOL executed = NO;
  dispatch_sync(_serialQueue, ^{
    XCTAssertFalse([idlingRes isIdleNow], @"Idling resource should track dispatch sync block");
    XCTAssertFalse(executed, @"Block should be pending execution");
    executed = YES;
  });
  XCTAssertTrue(executed, @"Block should be been executed");
  XCTAssertTrue([idlingRes isIdleNow], @"Idling resource should be idle after finishing execution");
}

- (void)testCreatingSecondIdlingResourceForSameQueueThrowsException {
  [[GREYConfiguration sharedInstance] setValue:@(0.5)
                                  forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
  GREYDispatchQueueIdlingResource *idlingRes =
      [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                            name:@"test"];
  XCTAssertNotNil(idlingRes);
  XCTAssertThrowsSpecificNamed(
      [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                            name:@"test"],
      NSException,
      NSInternalInconsistencyException,
      @"should throw exception since idlingRes is already registered for _dispatchQueue");
}

- (void)testCreatingSecondIdlingResourceForSameQueueSucceedsIfFirstOneWasDealloced {
  [[GREYConfiguration sharedInstance] setValue:@(0.5)
                                  forConfigKey:kGREYConfigKeyDispatchAfterMaxTrackableDelay];
  @autoreleasepool {
    __autoreleasing GREYDispatchQueueIdlingResource *idlingRes =
        [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                              name:@"test"];
    XCTAssertNotNil(idlingRes);
  }
  XCTAssertNoThrow([GREYDispatchQueueIdlingResource resourceWithDispatchQueue:_serialQueue
                                                                         name:@"test"],
                   @"should not throw exception since idlingRes was already deallocated");
}

@end
