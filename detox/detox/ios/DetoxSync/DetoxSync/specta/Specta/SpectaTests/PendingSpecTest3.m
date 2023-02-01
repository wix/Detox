#import "TestHelper.h"

static BOOL afterAllExecuted = NO;

SpecBegin(_PendingSpecTest3)

describe(@"group", ^{
  afterAll(^{ afterAllExecuted = YES; });
  it(@"it", ^{ NSAssert(YES, nil); });
  pending(@"pending");
});

SpecEnd

@interface PendingSpecTest3 : XCTestCase; @end
@implementation PendingSpecTest3

- (void)testPendingSpec {
  XCTestRun *result = RunSpec(_PendingSpecTest3Spec);
  assertEqual([result testCaseCount], 2);
  assertEqual([result unexpectedExceptionCount], 0);
  assertEqual([result failureCount], 0);
  assertTrue([result hasSucceeded]);
  assertTrue(afterAllExecuted);
}

@end
