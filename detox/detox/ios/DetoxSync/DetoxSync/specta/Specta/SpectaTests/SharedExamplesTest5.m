#import "TestHelper.h"

static BOOL shouldInvokeItShouldBehaveLike = NO;

SpecBegin(_SharedExamplesTest5)

sharedExamplesFor(@"shared1", ^(NSDictionary *data) {});

describe(@"group", ^{
  it(@"should fail", ^{
    if (shouldInvokeItShouldBehaveLike) {
      itShouldBehaveLike(@"shared1", nil);
    }
  });
});

SpecEnd

@interface SharedExamplesTest5 : XCTestCase; @end
@implementation SharedExamplesTest5

- (void)testSharedExamplesFailingIfCalledInsideAnItBlock {
  shouldInvokeItShouldBehaveLike = YES;
  XCTestRun *result = RunSpec(_SharedExamplesTest5Spec);
  assertEqual([result testCaseCount], 1);
  assertEqual([result unexpectedExceptionCount], 1);
  assertEqual([result failureCount], 0);
  assertFalse([result hasSucceeded]);
  shouldInvokeItShouldBehaveLike = NO;
}

@end
