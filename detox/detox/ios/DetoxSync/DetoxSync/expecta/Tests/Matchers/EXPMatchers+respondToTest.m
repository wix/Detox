#import "TestHelper.h"

@interface EXPMatchers_respondToTest : XCTestCase
{
  id foo;
  id baz;
}
@end

@implementation EXPMatchers_respondToTest

- (void)setUp {
  foo = [Foo new];
  baz = [Baz new];
}

- (void)test_respondTo {
  assertPass(test_expect(foo).respondTo(@selector(fooMethod)));
  assertPass(test_expect([Baz class]).respondTo(@selector(bazClassMethod)));
  assertPass(test_expect([Baz class]).respondTo(@selector(bazInstanceMethod)));

  assertFail(test_expect(baz).respondTo(@selector(fooMethod)), ([NSString stringWithFormat:@"expected: <Baz: %p> to respond to fooMethod", baz]));
  assertFail(test_expect([Foo class]).respondTo(@selector(bazClassMethod)), ([NSString stringWithFormat:@"expected: Foo to respond to bazClassMethod"]));

  assertFail(test_expect(nil).respondTo(@selector(fooMethod)), @"the object is nil/null");
  assertFail(test_expect(foo).respondTo(NULL), @"the selector is null");
}

- (void)test_toNot_respondTo {
  assertPass(test_expect(baz).notTo.respondTo(@selector(fooMethod)));
  assertPass(test_expect([Foo class]).notTo.respondTo(@selector(bazClassMethod)));
  assertPass(test_expect([Foo class]).notTo.respondTo(@selector(bazInstanceMethod)));

  assertFail(test_expect(foo).notTo.respondTo(@selector(fooMethod)), ([NSString stringWithFormat:@"expected: <Foo: %p> not to respond to fooMethod", foo]));
  assertFail(test_expect([Baz class]).notTo.respondTo(@selector(bazClassMethod)), ([NSString stringWithFormat:@"expected: Baz not to respond to bazClassMethod"]));

  assertFail(test_expect(nil).notTo.respondTo(@selector(fooMethod)), @"the object is nil/null");
  assertFail(test_expect(foo).notTo.respondTo(NULL), @"the selector is null");
}

@end
