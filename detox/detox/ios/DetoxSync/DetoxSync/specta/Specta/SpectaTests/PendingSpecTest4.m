#import "TestHelper.h"

static BOOL beforeAllExecuted, beforeEachExecuted, afterEachExecuted, afterAllExecuted;

SpecBegin(_PendingSpecTest4)

describe(@"group", ^{
  beforeAll(^{ beforeAllExecuted = YES; });
  beforeEach(^{ beforeEachExecuted = YES; });
  afterEach(^{ afterEachExecuted = YES; });
  afterAll(^{ afterAllExecuted = YES; });
  pending(@"pending");
});

SpecEnd

@interface PendingSpecTest4 : XCTestCase; @end
@implementation PendingSpecTest4

- (void)testPendingSpec {
  XCTestRun *result = RunSpec(_PendingSpecTest4Spec);
  assertEqual([result testCaseCount], 1);
  assertEqual([result unexpectedExceptionCount], 0);
  assertEqual([result failureCount], 0);
  assertTrue([result hasSucceeded]);
  assertTrue(beforeAllExecuted);
  assertFalse(beforeEachExecuted);
  assertFalse(afterEachExecuted);
  assertTrue(afterAllExecuted);
}

@end
