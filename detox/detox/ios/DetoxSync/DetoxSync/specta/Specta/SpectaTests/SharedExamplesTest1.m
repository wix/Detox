#import "TestHelper.h"

static NSMutableArray *items;

SpecBegin(_SharedExamplesTest1)

sharedExamplesFor(@"shared1", ^(NSDictionary *data) {
  describe(@"foo", ^{
    it(@"equals string 'Foo'", ^{
      assertEqualObjects(data[@"foo"], @"Foo");
    });
  });

  describe(@"bar", ^{
    it(@"equals string 'Bar'", ^{
      assertEqualObjects(data[@"bar"], @"Bar");
    });
  });
});

sharedExamples(@"shared2", ^(NSDictionary *data) {
  it(@"inserts data.baz to items", ^{
    [items addObject:data[@"baz"]];
  });
});

describe(@"group", ^{
  itShouldBehaveLike(@"shared1",
                     @{@"foo" : @"Foo",
                       @"bar" : @"Bar"});
});

itBehavesLike(@"shared2", @{@"baz": @"hello"});

context(@"group2", ^{
  itBehavesLike(@"shared2", @{@"baz": @"world"});
});

SpecEnd

@interface SharedExamplesTest1 : XCTestCase; @end
@implementation SharedExamplesTest1

- (void)testSharedExamples {
  items = [[NSMutableArray alloc] init];
  XCTestRun *result = RunSpec(_SharedExamplesTest1Spec);
  assertEqual([result testCaseCount], 4);
  assertEqual([result unexpectedExceptionCount], 0);
  assertEqual([result failureCount], 0);
  assertTrue([result hasSucceeded]);
  assertEqualObjects(items, (@[@"hello", @"world"]));
  items = nil;
}

@end
