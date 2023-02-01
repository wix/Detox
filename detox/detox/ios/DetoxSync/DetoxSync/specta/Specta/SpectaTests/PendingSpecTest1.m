#import "TestHelper.h"

SpecBegin(_PendingSpecTest1)

describe(@"group", ^{
  beforeAll(nil);
  afterAll(nil);
  beforeEach(nil);
  afterEach(nil);

  describe(@"describe with nil", nil);
  context(@"context with nil", nil);

  it(@"it with nil", nil);
  specify(@"specify with nil", nil);
  example(@"example with nil", nil);
});
SpecEnd

@interface PendingSpecTest1 : XCTestCase; @end
@implementation PendingSpecTest1

- (void)testPendingSpec {
  XCTestRun *result = RunSpec(_PendingSpecTest1Spec);
  assertEqual([result testCaseCount], 5);
  assertEqual([result unexpectedExceptionCount], 0);
  assertEqual([result failureCount], 0);
  assertTrue([result hasSucceeded]);
  // assertEqual([result pendingTestCaseCount], 5);
}

@end
