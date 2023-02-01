#import "TestHelper.h"

@interface EXPMatchers_containTest : XCTestCase {
  NSArray *array, *array2;
  NSSet* set;
  NSString *string;
  NSObject* object;
}
@end

@implementation EXPMatchers_containTest

- (void)setUp {
  array = @[@"foo", @"bar", @"baz"];
  array2 = @[[NSString class], [NSDictionary class]];
  set = [NSSet setWithObjects:@"foo", @"bar", nil];
  string = @"foo|bar,baz";
  object = [NSObject new];
}

- (void)test_contain {
  assertPass(test_expect(array).contain(@"foo"));
  assertPass(test_expect(array).contain(@"bar"));
  assertPass(test_expect(array).contain(@"baz"));
  assertPass(test_expect(set).contain(@"foo"));
  assertPass(test_expect(set).contain(@"bar"));
  assertPass(test_expect(string).contain(@"foo"));
  assertPass(test_expect(string).contain(@"bar"));
  assertPass(test_expect(string).contain(@"baz"));
  assertFail(test_expect(array).contain(@"qux"), @"expected (foo, bar, baz) to contain qux");
  assertFail(test_expect(string).contain(@"qux"), @"expected foo|bar,baz to contain qux");
  assertFail(test_expect(string).contain(nil), @"the expected value is nil/null");
  NSString* errorMessage = [NSString stringWithFormat:@"%@ is not an instance of NSString or NSFastEnumeration", object];
  assertFail(test_expect(object).contain(@"foo"), errorMessage);
  assertPass(test_expect(array2).contain([NSString class]));
}

- (void)test_toNot_contain {
  assertPass(test_expect(array).toNot.contain(@"qux"));
  assertPass(test_expect(array).toNot.contain(@"quux"));
  assertPass(test_expect(string).toNot.contain(@"qux"));
  assertPass(test_expect(string).toNot.contain(@"quux"));
  assertPass(test_expect(set).toNot.contain(@"qux"));
  assertPass(test_expect(set).toNot.contain(@"quux"));
  assertFail(test_expect(array).toNot.contain(@"foo"), @"expected (foo, bar, baz) not to contain foo");
  assertFail(test_expect(string).toNot.contain(@"baz"), @"expected foo|bar,baz not to contain baz");
  assertFail(test_expect(string).toNot.contain(nil), @"the expected value is nil/null");
  NSString* errorMessage = [NSString stringWithFormat:@"%@ is not an instance of NSString or NSFastEnumeration", object];
  assertFail(test_expect(object).toNot.contain(@"foo"), errorMessage);
  assertPass(test_expect(array2).toNot.contain([NSSet class]));
}

@end
