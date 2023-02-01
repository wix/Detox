#import "TestHelper.h"

@interface EXPMatchers_beInstanceOfTest : XCTestCase {
  Foo *foo;
  Bar *bar;
  id baz;
}
@end

@implementation EXPMatchers_beInstanceOfTest

- (void)setUp {
  foo = [[Foo new] autorelease];
  bar = [[Bar new] autorelease];
  baz = foo;
}

- (void)test_beInstanceOf {
  assertPass(test_expect(foo).beInstanceOf([Foo class]));
  assertPass(test_expect(bar).beInstanceOf([Bar class]));
  assertFail(test_expect(nil).beInstanceOf([Foo class]), @"the actual value is nil/null");
  assertFail(test_expect(foo).beInstanceOf(nil), @"the expected value is nil/null");
  assertFail(test_expect(foo).beInstanceOf([Bar class]), @"expected: an instance of Bar, got: an instance of Foo");
  assertFail(test_expect(bar).beInstanceOf([Foo class]), @"expected: an instance of Foo, got: an instance of Bar");
  assertPass(test_expect(baz).beInstanceOf([Foo class]));
}

- (void)test_toNot_beInstanceOf {
  assertPass(test_expect(foo).toNot.beInstanceOf([Bar class]));
  assertPass(test_expect(bar).toNot.beInstanceOf([Foo class]));
  assertFail(test_expect(nil).toNot.beInstanceOf([Foo class]), @"the actual value is nil/null");
  assertFail(test_expect(foo).toNot.beInstanceOf(nil), @"the expected value is nil/null");
  assertFail(test_expect(foo).toNot.beInstanceOf([Foo class]), @"expected: not an instance of Foo, got: an instance of Foo");
  assertFail(test_expect(bar).toNot.beInstanceOf([Bar class]), @"expected: not an instance of Bar, got: an instance of Bar");
  assertPass(test_expect(baz).toNot.beInstanceOf([Bar class]));
}

- (void)test_beAnInstanceOf {
  assertPass(test_expect(foo).beAnInstanceOf([Foo class]));
}

- (void)test_beMemberOf {
  assertPass(test_expect(foo).beMemberOf([Foo class]));
}

- (void)test_beAMemberOf {
  assertPass(test_expect(foo).beAMemberOf([Foo class]));
}

@end
