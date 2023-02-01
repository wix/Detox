#import "TestHelper.h"

SpecBegin(_PassingSpecTest)

describe(@"group", ^{
  it(@"example 1", ^{
    assertEqualObjects(@"foo", ([NSString stringWithFormat:@"f%@", @"oo"]));
  });

  it(@"example 2", ^{
    assertEqual(123, 100 + 23);
  });
});

SpecEnd

@interface PassingSpecTest : XCTestCase; @end
@implementation PassingSpecTest

- (void)testPassingSpec {
  XCTestRun *result = RunSpec(_PassingSpecTestSpec);
  assertEqual([result unexpectedExceptionCount], 0);
  assertEqual([result failureCount], 0);
  assertTrue([result hasSucceeded]);
}

@end
