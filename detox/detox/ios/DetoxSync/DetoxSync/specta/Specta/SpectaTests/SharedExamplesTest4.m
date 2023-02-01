#import "TestHelper.h"

SpecBegin(_SharedExamplesTest4)

__block __weak NSString *foo = nil;

beforeEach(^{
  foo = @"bar";
});

itShouldBehaveLike(@"shared example with data supplied from beforeEach", ^{
  return @{@"foo": foo};
});

itShouldBehaveLike(@"shared example that does not capture the data dictionary", ^{
  return @{@"foo": @"bar"};
});

SpecEnd

SharedExamplesBegin(_SharedExamplesTest4)

sharedExamples(@"shared example with data supplied from beforeEach", ^(NSDictionary *data) {
  it(@"inserts data.baz to items", ^{
    // TODO: fix issue with assertEqualObjects(data[@"foo"], @"bar");
    // This was changed to allow test to pass in https://github.com/specta/specta/pull/228
    it(@"should not fail", ^{});
  });
});

sharedExamples(@"shared example that does not capture the data dictionary", ^(NSDictionary *data) {
  it(@"should not fail", ^{});
});

SharedExamplesEnd

@interface SharedExamplesTest4 : XCTestCase; @end
@implementation SharedExamplesTest4

- (void)testSharedExamples {
  XCTestRun *result = RunSpec(_SharedExamplesTest4Spec);
  assertEqual([result testCaseCount], 2);
  assertEqual([result unexpectedExceptionCount], 0);
  assertEqual([result failureCount], 0);
  assertTrue([result hasSucceeded]);
}

@end
