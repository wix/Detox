#import "TestHelper.h"

@interface EXPMatchers_beNilTest : XCTestCase {
  NSObject *nilObject;
  int *nullPointer;
}
@end

@implementation EXPMatchers_beNilTest

- (void)setUp {
  nilObject = nil;
  nullPointer = NULL;
}

- (void)test_beNil {
  assertPass(test_expect(nil).beNil());
  assertPass(test_expect(nilObject).beNil());
  assertFail(test_expect(@"foo").beNil(), @"expected: nil/null, got: foo");
}

- (void)test_toNot_beNil {
  assertPass(test_expect(@"foo").toNot.beNil());
  assertFail(test_expect(nil).toNot.beNil(), @"expected: not nil/null, got: nil/null");
  assertFail(test_expect(nilObject).toNot.beNil(), @"expected: not nil/null, got: nil/null");
}

- (void)test_beNull {
  assertPass(test_expect(NULL).beNull());
  assertPass(test_expect(nullPointer).beNull());
}

- (void)test_toNot_beNull {
  assertFail(test_expect(NULL).toNot.beNull(), @"expected: not nil/null, got: nil/null");
  assertFail(test_expect(nullPointer).toNot.beNull(), @"expected: not nil/null, got: nil/null");
}

@end
