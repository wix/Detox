#import "TestHelper.h"

static NSMutableArray *items;

SharedExamplesBegin(MoreGlobalSharedExamples)

sharedExamplesFor(@"overridden shared example 1", ^(NSDictionary *data) {
  it(@"adds bar to items", ^{
    [items addObject:@"bar"];
  });
});

sharedExamplesFor(@"overridden shared example 2", ^(NSDictionary *data) {
  it(@"adds baz to items", ^{
    [items addObject:@"baz"];
  });
});

SharedExamplesEnd

SpecBegin(_SharedExamplesTest3)

sharedExamplesFor(@"overridden shared example 1", ^(NSDictionary *data) {
  it(@"adds foo to items", ^{
    [items addObject:@"foo"];
  });
});

describe(@"overriding global shared examples with local shared examples", ^{
  itBehavesLike(@"overridden shared example 1", nil); // ['foo']
  itBehavesLike(@"overridden shared example 2", nil); // ['foo', 'baz']

  describe(@"another override", ^{
    sharedExamplesFor(@"overridden shared example 1", ^(NSDictionary *data) {
      it(@"adds qux to items", ^{
        [items addObject:@"qux"];
      });
    });

    sharedExamplesFor(@"overridden shared example 2", ^(NSDictionary *data) {
      it(@"adds faz to items", ^{
        [items addObject:@"faz"];
      });
    });

    itBehavesLike(@"overridden shared example 1", nil); // ['foo', 'baz', 'qux']
    itBehavesLike(@"overridden shared example 2", nil); // ['foo', 'baz', 'qux', 'faz']
  });

  itBehavesLike(@"overridden shared example 1", nil); // ['foo', 'baz', 'qux', 'faz', 'foo']
  itBehavesLike(@"overridden shared example 2", nil); // ['foo', 'baz', 'qux', 'faz', 'foo', 'baz']
});

SpecEnd

@interface SharedExamplesTest3 : XCTestCase; @end
@implementation SharedExamplesTest3

- (void)testSharedExamples {
  items = [[NSMutableArray alloc] init];
  RunSpec(_SharedExamplesTest3Spec);
  assertEqualObjects(items, (@[@"foo", @"baz", @"qux", @"faz", @"foo", @"baz"]));
  items = nil;
}

@end
