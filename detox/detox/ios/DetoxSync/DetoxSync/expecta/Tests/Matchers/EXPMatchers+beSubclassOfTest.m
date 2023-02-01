#import "TestHelper.h"

@interface EXPMatchers_beSubclassOfTest : XCTestCase
@end

@implementation EXPMatchers_beSubclassOfTest

- (void)test_beSubclassOf {
  assertPass(test_expect([Foo class]).beSubclassOf([Foo class]));
  assertPass(test_expect([Bar class]).beSubclassOf([Bar class]));
  assertPass(test_expect([Bar class]).beSubclassOf([Foo class]));
  assertFail(test_expect([Foo class]).beSubclassOf([Bar class]), @"expected: a subclass of Bar, got: a class Foo, which is not a subclass of Bar");
  assertFail(test_expect([Bar class]).beSubclassOf([Baz class]), @"expected: a subclass of Baz, got: a class Bar, which is not a subclass of Baz");
  assertFail(test_expect(@"foo").beSubclassOf([Baz class]), @"the actual value is not a Class");
}

- (void)test_toNot_beSubclassOf {
  assertPass(test_expect([Foo class]).toNot.beSubclassOf([Bar class]));
  assertPass(test_expect([Bar class]).toNot.beSubclassOf([Baz class]));
  assertPass(test_expect([Baz class]).toNot.beSubclassOf([Foo class]));
  assertFail(test_expect([Foo class]).toNot.beSubclassOf([Foo class]), @"expected: not a subclass of Foo, got: a class Foo, which is a subclass of Foo");
  assertFail(test_expect([Bar class]).toNot.beSubclassOf([Foo class]), @"expected: not a subclass of Foo, got: a class Bar, which is a subclass of Foo");
  assertFail(test_expect(@"foo").toNot.beSubclassOf([Baz class]), @"the actual value is not a Class");
}

- (void)test_beASubclassOf {
  assertPass(test_expect([Bar class]).beASubclassOf([Foo class]));
}

@end
