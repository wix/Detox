#import "TestHelper.h"

@interface EXPMatchers_beTruthyTest : XCTestCase {
  int *nullPointer;
}
@end

@implementation EXPMatchers_beTruthyTest

- (void)setUp {
  nullPointer = NULL;
}

- (void)test_beTruthy {
  assertPass(test_expect(YES).beTruthy());
  assertPass(test_expect(TRUE).beTruthy());
  assertPass(test_expect(1).beTruthy());
  assertPass(test_expect(123).beTruthy());
  assertPass(test_expect(-123).beTruthy());
  assertPass(test_expect(0.1).beTruthy());
  assertPass(test_expect(@"hello").beTruthy());
  assertFail(test_expect(NO).beTruthy(), @"expected: a truthy value, got: 0, which is falsy");
  assertFail(test_expect(FALSE).beTruthy(), @"expected: a truthy value, got: 0, which is falsy");
  assertFail(test_expect(0).beTruthy(), @"expected: a truthy value, got: 0, which is falsy");
  assertFail(test_expect(nil).beTruthy(), @"expected: a truthy value, got: nil/null, which is falsy");
  assertFail(test_expect(nullPointer).beTruthy(), @"expected: a truthy value, got: nil/null, which is falsy");
}

- (void)test_toNot_beTruthy {
  assertPass(test_expect(NO).toNot.beTruthy());
  assertPass(test_expect(FALSE).toNot.beTruthy());
  assertPass(test_expect(0).toNot.beTruthy());
  assertPass(test_expect(nil).toNot.beTruthy());
  assertPass(test_expect(nullPointer).toNot.beTruthy());
  assertFail(test_expect(YES).toNot.beTruthy(), @"expected: a non-truthy value, got: 1, which is truthy");
  assertFail(test_expect(TRUE).toNot.beTruthy(), @"expected: a non-truthy value, got: 1, which is truthy");
  assertFail(test_expect(1).toNot.beTruthy(), @"expected: a non-truthy value, got: 1, which is truthy");
  assertFail(test_expect(123).toNot.beTruthy(), @"expected: a non-truthy value, got: 123, which is truthy");
  assertFail(test_expect(-123).toNot.beTruthy(), @"expected: a non-truthy value, got: -123, which is truthy");
  assertFail(test_expect(0.1).toNot.beTruthy(), @"expected: a non-truthy value, got: 0.1, which is truthy");
  assertFail(test_expect(@"hello").toNot.beTruthy(), @"expected: a non-truthy value, got: hello, which is truthy");
}

@end
