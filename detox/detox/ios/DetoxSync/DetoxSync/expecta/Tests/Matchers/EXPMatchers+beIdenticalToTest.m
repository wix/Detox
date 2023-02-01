#import "TestHelper.h"

@interface EXPMatchers_beIdenticalToTest : XCTestCase {
  NSMutableString *foo;
  NSMutableString *foo2;
  id foo3;
}
@end

@implementation EXPMatchers_beIdenticalToTest

- (void)setUp {
  foo  = [NSMutableString stringWithString:@"foo"];
  foo2 = [NSMutableString stringWithString:@"foo"];
  foo3 = foo;
}

- (void)test_be {
  assertPass(test_expect(nil).beIdenticalTo(nil));
  assertPass(test_expect(foo).beIdenticalTo(foo));
  assertPass(test_expect(foo).beIdenticalTo(foo3));
  assertFail(test_expect(foo).beIdenticalTo(foo2), ([NSString stringWithFormat:@"expected: <%p>, got: <%p>", foo2, foo]));
  assertFail(test_expect(nil).beIdenticalTo(foo), ([NSString stringWithFormat:@"expected: <%p>, got: <0x0>", foo]));
}

- (void)test_toNot_be {
  assertPass(test_expect(foo).toNot.beIdenticalTo(foo2));
  assertPass(test_expect(nil).toNot.beIdenticalTo(foo));
  assertFail(test_expect(nil).toNot.beIdenticalTo(nil), @"expected: not <0x0>, got: <0x0>");
  assertFail(test_expect(foo).toNot.beIdenticalTo(foo), ([NSString stringWithFormat:@"expected: not <%p>, got: <%p>", foo, foo]));
  assertFail(test_expect(foo).toNot.beIdenticalTo(foo3), ([NSString stringWithFormat:@"expected: not <%p>, got: <%p>", foo, foo]));
}

@end
