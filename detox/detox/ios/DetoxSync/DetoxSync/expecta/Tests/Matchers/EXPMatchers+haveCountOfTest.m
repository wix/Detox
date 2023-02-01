#import "TestHelper.h"

@interface EXPMatchers_haveCountOfTest : XCTestCase {
  NSArray *array;
  NSSet* set;
  NSOrderedSet *orderedSet;
  NSDictionary* dictionary;
  NSString *string;
  NSAttributedString *attributedString;
  NSObject* object;
}
@end

@implementation EXPMatchers_haveCountOfTest

- (void)setUp {
  array = @[@"foo", @"bar", @"baz"];
  set = [NSSet setWithObjects:@"foo", @"bar", nil];
  orderedSet = [NSOrderedSet orderedSetWithObjects:@"foo", @"bar", @"baz", @"qux", nil];
  dictionary = @{@"key": @"value"};
  string = @"foobar";
  attributedString = [[NSAttributedString alloc] initWithString:@"foobar"];
  object = [NSObject new];
}

- (void)test_haveCountOf {
  assertPass(test_expect(array).haveCountOf(3));
  assertPass(test_expect(array).haveCount(3));
  assertPass(test_expect(set).haveCountOf(2));
  assertPass(test_expect(orderedSet).haveCountOf(4));
  assertPass(test_expect(dictionary).haveCountOf(1));
  assertPass(test_expect(string).haveCountOf(6));
  assertPass(test_expect(attributedString).haveCountOf(6));
  assertFail(test_expect(array).haveCountOf(2), @"expected (foo, bar, baz) to have a count of 2 but got 3");
  assertFail(test_expect(set).haveCountOf(3), @"expected {(foo, bar)} to have a count of 3 but got 2");
  assertFail(test_expect(orderedSet).haveCountOf(3), @"expected {(foo, bar, baz, qux)} to have a count of 3 but got 4");
  assertFail(test_expect(string).haveCountOf(3), @"expected foobar to have a count of 3 but got 6");
  assertFail(test_expect(attributedString).haveCountOf(3), @"expected foobar to have a count of 3 but got 6");
  NSString* errorMessage = [NSString stringWithFormat:@"%@ is not an instance of NSString, NSAttributedString, NSArray, NSSet, NSOrderedSet, or NSDictionary", object];
  assertFail(test_expect(object).haveCountOf(2), errorMessage);
}

- (void)test_toNot_haveCountOf {
  assertPass(test_expect(array).toNot.haveCountOf(5));
  assertPass(test_expect(set).toNot.haveCountOf(3));
  assertPass(test_expect(dictionary).toNot.haveCountOf(6));
  assertPass(test_expect(string).toNot.haveCountOf(1));
  assertPass(test_expect(attributedString).toNot.haveCountOf(1));
  assertFail(test_expect(array).toNot.haveCountOf(3), @"expected (foo, bar, baz) not to have a count of 3");
  assertFail(test_expect(set).notTo.haveCountOf(2), @"expected {(foo, bar)} not to have a count of 2");
  assertFail(test_expect(orderedSet).notTo.haveCountOf(4), @"expected {(foo, bar, baz, qux)} not to have a count of 4");
  assertFail(test_expect(string).toNot.haveCountOf(6), @"expected foobar not to have a count of 6");
  assertFail(test_expect(attributedString).toNot.haveCountOf(6), @"expected foobar not to have a count of 6");
  NSString* errorMessage = [NSString stringWithFormat:@"%@ is not an instance of NSString, NSAttributedString, NSArray, NSSet, NSOrderedSet, or NSDictionary", object];
  assertFail(test_expect(object).toNot.haveCountOf(2), errorMessage);
}

- (void)test_haveCount {
  assertPass(test_expect(array).haveCount(3));
}

- (void)test_haveACountOf {
  assertPass(test_expect(array).haveACountOf(3));
}

- (void)test_haveLength {
  assertPass(test_expect(array).haveLength(3));
}

- (void)test_haveLengthOf {
  assertPass(test_expect(array).haveLengthOf(3));
}

- (void)test_haveALengthOf {
  assertPass(test_expect(array).haveALengthOf(3));
}

@end
