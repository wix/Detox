#import "TestHelper.h"

@interface EXPMatchers_beSupersetOfTest : XCTestCase {
  NSArray *array;
  NSSet *set;
  NSOrderedSet *orderedSet;
  NSDictionary *dictionary;
  NSObject *object;
  NSDictionary *json;
}
@end

@implementation EXPMatchers_beSupersetOfTest

- (void)setUp {
  array = @[ @"foo", @"bar", @"baz" ];
  set = [NSSet setWithObjects:@"foo", @"bar", nil];
  orderedSet = [NSOrderedSet orderedSetWithArray:array];
    dictionary = @{ @"foo" : @1, @"bar" : @2 };
  object = [[NSObject alloc] init];
  json = [NSJSONSerialization JSONObjectWithData:[@"{\"foo\":1,\"bar\":2}" dataUsingEncoding:NSUTF8StringEncoding]
                                         options:kNilOptions
                                           error:nil];
}

- (void)test_beSupersetOf {
  assertPass(test_expect(array).beSupersetOf(@[@"foo"]));
  assertPass(test_expect(set).beSupersetOf([NSSet setWithObject:@"bar"]));
  assertPass(test_expect(orderedSet).beSupersetOf([NSOrderedSet orderedSetWithObject:@"baz"]));
  assertPass(test_expect(dictionary).beSupersetOf(@{@"bar" : @2}));
  assertPass(test_expect(json).beSupersetOf(@{@"bar" : @2}));

  assertPass(test_expect(array).beSupersetOf(@[@"foo"].mutableCopy));
  assertPass(test_expect(set).beSupersetOf([NSSet setWithObject:@"bar"].mutableCopy));
  assertPass(test_expect(orderedSet).beSupersetOf([NSOrderedSet orderedSetWithObject:@"baz"].mutableCopy));
  assertPass(test_expect(dictionary).beSupersetOf(@{@"bar" : @2}.mutableCopy));

  assertPass(test_expect(array.mutableCopy).beSupersetOf(@[@"foo"]));
  assertPass(test_expect(set.mutableCopy).beSupersetOf([NSSet setWithObject:@"bar"]));
  assertPass(test_expect(orderedSet.mutableCopy).beSupersetOf([NSOrderedSet orderedSetWithObject:@"baz"]));
  assertPass(test_expect(dictionary.mutableCopy).beSupersetOf(@{@"bar" : @2}));

  assertPass(test_expect(array).beSupersetOf(array));
  assertPass(test_expect(set).beSupersetOf(set));
  assertPass(test_expect(orderedSet).beSupersetOf(orderedSet));
  assertPass(test_expect(dictionary).beSupersetOf(dictionary));
  assertPass(test_expect(json).beSupersetOf(json));

  assertPass(test_expect(array).beSupersetOf([NSArray array]));
  assertPass(test_expect(set).beSupersetOf([NSSet set]));
  assertPass(test_expect(orderedSet).beSupersetOf([NSOrderedSet orderedSet]));
  assertPass(test_expect(dictionary).beSupersetOf([NSDictionary dictionary]));

  assertFail(test_expect(array).beSupersetOf(@[ @"xyz" ]), @"expected (foo, bar, baz) to be a superset of (xyz)");
  assertFail(test_expect(set).beSupersetOf([NSSet setWithObject:@"xyz"]), @"expected {(foo, bar)} to be a superset of {(xyz)}");
  assertFail(test_expect(orderedSet).beSupersetOf([NSOrderedSet orderedSetWithObject:@"xyz"]), @"expected {(foo, bar, baz)} to be a superset of {(xyz)}");
  assertFail(test_expect(dictionary).beSupersetOf(@{ @"xyz" : @2 }), @"expected {foo = 1; bar = 2;} to be a superset of {xyz = 2;}");

  assertFail(test_expect(nil).beSupersetOf([NSArray array]), @"nil/null is not an instance of NSDictionary and does not implement -containsObject:");
  assertFail(test_expect(array).beSupersetOf(nil), @"the expected value is nil/null");
  assertFail(test_expect(array).beSupersetOf(set), @"{(foo, bar)} does not match the class of (foo, bar, baz)");
}

- (void)test_toNot_beSupersetOf {
  assertFail(test_expect(array).notTo.beSupersetOf(@[ @"foo"] ), @"expected (foo, bar, baz) not to be a superset of (foo)");
  assertFail(test_expect(set).notTo.beSupersetOf([NSSet setWithObject:@"bar"]), @"expected {(foo, bar)} not to be a superset of {(bar)}");
  assertFail(test_expect(orderedSet).notTo.beSupersetOf([NSOrderedSet orderedSetWithObject:@"baz"]), @"expected {(foo, bar, baz)} not to be a superset of {(baz)}");
  assertFail(test_expect(dictionary).notTo.beSupersetOf(@{ @"bar" : @2 }), @"expected {foo = 1; bar = 2;} not to be a superset of {bar = 2;}");

  assertFail(test_expect(array).notTo.beSupersetOf(@[ @"foo"].mutableCopy ), @"expected (foo, bar, baz) not to be a superset of (foo)");
  assertFail(test_expect(set).notTo.beSupersetOf([NSSet setWithObject:@"bar"].mutableCopy), @"expected {(foo, bar)} not to be a superset of {(bar)}");
  assertFail(test_expect(orderedSet).notTo.beSupersetOf([NSOrderedSet orderedSetWithObject:@"baz"].mutableCopy), @"expected {(foo, bar, baz)} not to be a superset of {(baz)}");
  assertFail(test_expect(dictionary).notTo.beSupersetOf(@{ @"bar" : @2 }.mutableCopy), @"expected {foo = 1; bar = 2;} not to be a superset of {bar = 2;}");

  assertFail(test_expect(array.mutableCopy).notTo.beSupersetOf(@[ @"foo"] ), @"expected (foo, bar, baz) not to be a superset of (foo)");
  assertFail(test_expect(set.mutableCopy).notTo.beSupersetOf([NSSet setWithObject:@"bar"]), @"expected {(foo, bar)} not to be a superset of {(bar)}");
  assertFail(test_expect(orderedSet.mutableCopy).notTo.beSupersetOf([NSOrderedSet orderedSetWithObject:@"baz"]), @"expected {(foo, bar, baz)} not to be a superset of {(baz)}");
  assertFail(test_expect(dictionary.mutableCopy).notTo.beSupersetOf(@{ @"bar" : @2 }), @"expected {foo = 1; bar = 2;} not to be a superset of {bar = 2;}");

  assertFail(test_expect(array).notTo.beSupersetOf(array), @"expected (foo, bar, baz) not to be a superset of (foo, bar, baz)");
  assertFail(test_expect(set).notTo.beSupersetOf(set), @"expected {(foo, bar)} not to be a superset of {(foo, bar)}");
  assertFail(test_expect(orderedSet).notTo.beSupersetOf(orderedSet), @"expected {(foo, bar, baz)} not to be a superset of {(foo, bar, baz)}");
  assertFail(test_expect(dictionary).notTo.beSupersetOf(dictionary), @"expected {foo = 1; bar = 2;} not to be a superset of {foo = 1; bar = 2;}");

  assertFail(test_expect(array).notTo.beSupersetOf([NSArray array]), @"expected (foo, bar, baz) not to be a superset of ()");
  assertFail(test_expect(set).notTo.beSupersetOf([NSSet set]), @"expected {(foo, bar)} not to be a superset of {()}");
  assertFail(test_expect(orderedSet).notTo.beSupersetOf([NSOrderedSet orderedSet]), @"expected {(foo, bar, baz)} not to be a superset of {()}");
  assertFail(test_expect(dictionary).notTo.beSupersetOf([NSDictionary dictionary]), @"expected {foo = 1; bar = 2;} not to be a superset of {}");

  assertPass(test_expect(array).notTo.beSupersetOf(@[ @"xyz" ]));
  assertPass(test_expect(set).notTo.beSupersetOf([NSSet setWithObject:@"xyz"]));
  assertPass(test_expect(orderedSet).notTo.beSupersetOf([NSOrderedSet orderedSetWithObject:@"xyz"]));
  assertPass(test_expect(dictionary).notTo.beSupersetOf(@{ @"xyz" : @2 }));
  assertPass(test_expect(json).notTo.beSupersetOf(@{@"xyz" : @2}));

  assertPass(test_expect(array).notTo.beSupersetOf(@[ @"xyz" ].mutableCopy));
  assertPass(test_expect(set).notTo.beSupersetOf([NSSet setWithObject:@"xyz"].mutableCopy));
  assertPass(test_expect(orderedSet).notTo.beSupersetOf([NSOrderedSet orderedSetWithObject:@"xyz"].mutableCopy));
  assertPass(test_expect(dictionary).notTo.beSupersetOf(@{ @"xyz" : @2 }.mutableCopy));

  assertPass(test_expect(array.mutableCopy).notTo.beSupersetOf(@[ @"xyz" ]));
  assertPass(test_expect(set.mutableCopy).notTo.beSupersetOf([NSSet setWithObject:@"xyz"]));
  assertPass(test_expect(orderedSet.mutableCopy).notTo.beSupersetOf([NSOrderedSet orderedSetWithObject:@"xyz"]));
  assertPass(test_expect(dictionary.mutableCopy).notTo.beSupersetOf(@{ @"xyz" : @2 }));

  assertFail(test_expect(nil).notTo.beSupersetOf([NSArray array]), @"nil/null is not an instance of NSDictionary and does not implement -containsObject:");
  assertFail(test_expect(array).notTo.beSupersetOf(nil), @"the expected value is nil/null");
  assertFail(test_expect(array).notTo.beSupersetOf(set), @"{(foo, bar)} does not match the class of (foo, bar, baz)");
}

@end
