#import "TestHelper.h"

static NSString
  *foo = @"foo"
, *bar = @"bar"
;

SpecBegin(_FailingSpecTest)

describe(@"group", ^{
  it(@"example 1", ^{
    assertEqualObjects(foo, @"foo");
  });

  it(@"example 2", ^{
    assertEqualObjects(bar, @"bar");
  });
});

SpecEnd

@interface FailingSpecTest : XCTestCase; @end
@implementation FailingSpecTest

- (void)testFailingSpec {
  foo = @"not foo";
  bar = @"not bar";
  XCTestRun *result = RunSpec(_FailingSpecTestSpec);
  assertEqual([result unexpectedExceptionCount], 0);
  assertEqual([result failureCount], 2);
  assertFalse([result hasSucceeded]);
  foo = @"foo";
  bar = @"bar";
}

@end
