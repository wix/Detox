#import "TestHelper.h"

// We expect the `itBehavesLike` example to fail.
// Use this flag to ensure the example is only
// run during the test case below.
static BOOL shouldInvokeItBehavesLike = NO;

SpecBegin(_SharedExamplesTest6)

it(@"fails", ^{
  if (shouldInvokeItBehavesLike) {
    itBehavesLike(@"a set of shared examples that don't exist", nil);
  }
});

SpecEnd

@interface SharedExamplesTest6 : XCTestCase; @end
@implementation SharedExamplesTest6

- (void)testSharedExamplesFailingIfNonexistent {
  shouldInvokeItBehavesLike = YES;
  XCTestRun *result = RunSpec(_SharedExamplesTest6Spec);
  assertEqual([result testCaseCount], 1);
  assertEqual([result unexpectedExceptionCount], 1);
  assertEqual([result failureCount], 0);
  assertFalse([result hasSucceeded]);
  shouldInvokeItBehavesLike = NO;
}

@end
