#import "TestHelper.h"

@interface EXPMatchers_beKindOfTest : XCTestCase {
  Foo *foo;
  Bar *bar;
  Baz *baz;
  id qux;
}
@end

@implementation EXPMatchers_beKindOfTest

- (void)setUp {
  foo = [[Foo new] autorelease];
  bar = [[Bar new] autorelease];
  baz = [[Baz new] autorelease];
  qux = foo;
}

- (void)test_beKindOf {
  assertPass(test_expect(foo).beKindOf([Foo class]));
  assertPass(test_expect(bar).beKindOf([Bar class]));
  assertPass(test_expect(bar).beKindOf([Foo class]));
  assertFail(test_expect(nil).beKindOf([Foo class]), @"the actual value is nil/null");
  assertFail(test_expect(foo).beKindOf(nil), @"the expected value is nil/null");
  assertFail(test_expect(foo).beKindOf([Bar class]), @"expected: a kind of Bar, got: an instance of Foo, which is not a kind of Bar");
  assertFail(test_expect(bar).beKindOf([Baz class]), @"expected: a kind of Baz, got: an instance of Bar, which is not a kind of Baz");
  assertPass(test_expect(qux).beKindOf([Foo class]));
}

- (void)test_toNot_beKindOf {
  assertPass(test_expect(foo).toNot.beKindOf([Bar class]));
  assertPass(test_expect(bar).toNot.beKindOf([Baz class]));
  assertPass(test_expect(baz).toNot.beKindOf([Foo class]));
  assertFail(test_expect(nil).toNot.beKindOf([Foo class]), @"the actual value is nil/null");
  assertFail(test_expect(foo).toNot.beKindOf(nil), @"the expected value is nil/null");
  assertFail(test_expect(foo).toNot.beKindOf([Foo class]), @"expected: not a kind of Foo, got: an instance of Foo, which is a kind of Foo");
  assertFail(test_expect(bar).toNot.beKindOf([Foo class]), @"expected: not a kind of Foo, got: an instance of Bar, which is a kind of Foo");
  assertPass(test_expect(qux).toNot.beKindOf([Bar class]));
}

- (void)test_beAKindOf {
  assertPass(test_expect(foo).beAKindOf([Foo class]));
}

@end
