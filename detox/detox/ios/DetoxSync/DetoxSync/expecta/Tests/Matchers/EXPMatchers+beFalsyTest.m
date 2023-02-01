#import "TestHelper.h"

@interface EXPMatchers_beFalsyTest : XCTestCase {
  int *nullPointer;
}
@end

@implementation EXPMatchers_beFalsyTest

- (void)setUp {
  nullPointer = NULL;
}

- (void)test_beFalsy {
  assertPass(test_expect(NO).beFalsy());
  assertPass(test_expect(FALSE).beFalsy());
  assertPass(test_expect(0).beFalsy());
  assertPass(test_expect(nil).beFalsy());
  assertPass(test_expect(nullPointer).beFalsy());
  assertFail(test_expect(YES).beFalsy(), @"expected: a falsy value, got: 1, which is truthy");
  assertFail(test_expect(TRUE).beFalsy(), @"expected: a falsy value, got: 1, which is truthy");
  assertFail(test_expect(1).beFalsy(), @"expected: a falsy value, got: 1, which is truthy");
  assertFail(test_expect(123).beFalsy(), @"expected: a falsy value, got: 123, which is truthy");
  assertFail(test_expect(-123).beFalsy(), @"expected: a falsy value, got: -123, which is truthy");
  assertFail(test_expect(0.1).beFalsy(), @"expected: a falsy value, got: 0.1, which is truthy");
  assertFail(test_expect(@"hello").beFalsy(), @"expected: a falsy value, got: hello, which is truthy");
}

- (void)test_toNot_beFalsy {
  assertPass(test_expect(YES).toNot.beFalsy());
  assertPass(test_expect(TRUE).toNot.beFalsy());
  assertPass(test_expect(1).toNot.beFalsy());
  assertPass(test_expect(123).toNot.beFalsy());
  assertPass(test_expect(-123).toNot.beFalsy());
  assertPass(test_expect(0.1).toNot.beFalsy());
  assertPass(test_expect(@"hello").toNot.beFalsy());
  assertFail(test_expect(NO).toNot.beFalsy(), @"expected: a non-falsy value, got: 0, which is falsy");
  assertFail(test_expect(FALSE).toNot.beFalsy(), @"expected: a non-falsy value, got: 0, which is falsy");
  assertFail(test_expect(0).toNot.beFalsy(), @"expected: a non-falsy value, got: 0, which is falsy");
  assertFail(test_expect(nil).toNot.beFalsy(), @"expected: a non-falsy value, got: nil/null, which is falsy");
  assertFail(test_expect(nullPointer).toNot.beFalsy(), @"expected: a non-falsy value, got: nil/null, which is falsy");
}

@end
