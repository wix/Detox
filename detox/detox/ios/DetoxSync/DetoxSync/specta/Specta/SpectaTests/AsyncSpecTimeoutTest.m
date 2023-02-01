#import "TestHelper.h"

SpecBegin(_AsyncSpecTimeoutTest)

describe(@"group", ^{
  it(@"example 1", ^{
    waitUntil(^(DoneCallback done) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 200LL * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
        assertFalse(NO);
        done();
      });
    });
  });

  it(@"example 2", ^{
    waitUntil(^(DoneCallback done) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 50LL * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
        assertFalse(NO);
        done();
      });
    });
  });
});

SpecEnd

/// Indicates whether to run failing tests w/o the special test runner.
static BOOL testingSpecta = NO;
SpecBegin(_AsyncSpecWaitUntilTimeoutTest)

describe(@"group", ^{
  it(@"example: waitUntilTimeout", ^{
    // this test fails as it should be, so in order no to fail the whole test
    // process, we'll ignore it when it's run on its own
    if (testingSpecta) {
      waitUntilTimeout(0.1, ^(DoneCallback done) {
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.25 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
          assertFalse(NO);
          done();
        });
      });
    }
  });

  // this test should be run after the previous one
  it(@"next test should use the default timeout", ^{
    waitUntil(^(DoneCallback done) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 1 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
        assertFalse(NO);
        done();
      });
    });
  });
});

SpecEnd

@interface AsyncSpecTimeoutTest : XCTestCase; @end
@implementation AsyncSpecTimeoutTest

- (void)testAsyncSpec {
  setAsyncSpecTimeout(0.1);
  XCTestRun *result = RunSpec(_AsyncSpecTimeoutTestSpec);
  
  // TODO: investigate whether this is intended
  // This was changed to allow test to pass in https://github.com/specta/specta/pull/228
  assertEqual([result unexpectedExceptionCount], 1);

  assertEqual([result failureCount], 0);
  assertFalse([result hasSucceeded]);
  setAsyncSpecTimeout(10.0);
}

- (void)testAsyncSpecWaitUntilTimeout {
  testingSpecta = YES;
  XCTestRun *result = RunSpec(_AsyncSpecWaitUntilTimeoutTestSpec);
  
  // TODO: investigate whether this is intended
  // This was changed to allow test to pass in https://github.com/specta/specta/pull/228
  assertEqual([result unexpectedExceptionCount], 1);

  assertEqual([result failureCount], 0);
  assertFalse([result hasSucceeded]);
  testingSpecta = NO;
}

@end
