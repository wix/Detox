#import "TestHelper.h"
#import "NSValue+Expecta.h"

@interface EXPMatchers_equalTest : XCTestCase

@end

@implementation EXPMatchers_equalTest

// These methods are declared to prevent "undeclared selector" compiler warnings
- (void)foo {}
- (void)bar {}
- (void)bar:(id)arg {}

- (void)test_equal_nil {
  assertPass(test_expect(nil).equal(nil));
  assertFail(test_expect(@"foo").equal(nil), @"expected: nil/null, got: foo");
}

- (void)test_toNot_equal_nil {
  assertPass(test_expect(@"foo").toNot.equal(nil));
  assertFail(test_expect(nil).toNot.equal(nil), @"expected: not nil/null, got: nil/null");
}

- (void)test_equal_object {
  NSObject *foo = [NSObject new], *bar = [NSObject new];
  assertPass(test_expect(foo).equal(foo));
  assertFail(test_expect(foo).equal(bar), ([NSString stringWithFormat:@"expected: %@, got: %@", bar, foo]));
  [foo release];
  [bar release];
}

- (void)test_toNot_equal_object {
  NSObject *foo = [NSObject new], *bar = [NSObject new];
  assertPass(test_expect(foo).toNot.equal(bar));
  assertFail(test_expect(foo).toNot.equal(foo), ([NSString stringWithFormat:@"expected: not %@, got: %@", foo, foo]));
  [foo release];
  [bar release];
}

- (void)test_equal_NSString {
  assertPass(test_expect(@"foo").equal(@"foo"));
  assertFail(test_expect(@"foo").equal(@"bar"), @"expected: bar, got: foo");
}

- (void)test_toNot_equal_NSString {
  assertPass(test_expect(@"foo").toNot.equal(@"bar"));
  assertFail(test_expect(@"foo").toNot.equal(@"foo"), @"expected: not foo, got: foo");
}

- (void)test_equal_SEL {
  assertPass(test_expect(@selector(foo)).equal(@selector(foo)));
  assertFail(test_expect(@selector(foo)).equal(@selector(bar:)), @"expected: @selector(bar:), got: @selector(foo)");
}

- (void)test_toNot_equal_SEL {
  assertPass(test_expect(@selector(foo)).toNot.equal(@selector(bar:)));
  assertFail(test_expect(@selector(foo)).toNot.equal(@selector(foo)), @"expected: not @selector(foo), got: @selector(foo)");
}

- (void)test_equal_Class {
  assertPass(test_expect([NSString class]).equal([NSString class]));
  assertFail(test_expect([NSString class]).equal([NSArray class]), @"expected: NSArray, got: NSString");
}

- (void)test_toNot_equal_Class {
  assertPass(test_expect([NSString class]).toNot.equal([NSArray class]));
  assertFail(test_expect([NSString class]).toNot.equal([NSString class]), @"expected: not NSString, got: NSString");
}

- (void)test_equal_BOOL {
  assertPass(test_expect(NO).equal(NO));
  assertFail(test_expect(NO).equal(YES), @"expected: 1, got: 0");
}

- (void)test_toNot_equal_BOOL {
  assertPass(test_expect(NO).toNot.equal(YES));
  assertFail(test_expect(NO).toNot.equal(NO), @"expected: not 0, got: 0");
}

- (void)test_equal_char {
  assertPass(test_expect((char)10).equal((char)10));
  assertFail(test_expect((char)10).equal((char)20), @"expected: 20, got: 10");
}

- (void)test_toNot_equal_char {
  assertPass(test_expect((char)10).toNot.equal((char)20));
  assertFail(test_expect((char)10).toNot.equal((char)10), @"expected: not 10, got: 10");
}

- (void)test_equal_int {
  assertPass(test_expect((int)0).equal((int)0));
  assertFail(test_expect((int)0).equal((int)1), @"expected: 1, got: 0");
}

- (void)test_toNot_equal_int {
  assertPass(test_expect((int)0).toNot.equal((int)1));
  assertFail(test_expect((int)0).toNot.equal((int)0), @"expected: not 0, got: 0");
}

- (void)test_equal_int_char {
  assertPass(test_expect((int)0).equal((char)0));
  assertFail(test_expect((int)0).equal((char)1), @"expected: 1, got: 0");
}

- (void)test_toNot_equal_int_char {
  assertPass(test_expect((int)0).toNot.equal((char)1));
  assertFail(test_expect((int)0).toNot.equal((char)0), @"expected: not 0, got: 0");
}

- (void)test_equal_int_unsigned_int {
  assertPass(test_expect((int)0).equal((unsigned int)0));
  assertFail(test_expect((int)0).equal((unsigned int)1), @"expected: 1, got: 0");
}

- (void)test_toNot_equal_int_unsigned_int {
  assertPass(test_expect((int)0).toNot.equal((unsigned int)1));
  assertFail(test_expect((int)0).toNot.equal((unsigned int)0), @"expected: not 0, got: 0");
}

- (void)test_equal_int_long_long {
  assertPass(test_expect((int)0).equal(0ll));
  assertFail(test_expect((int)0).equal(1ll), @"expected: 1, got: 0");
}

- (void)test_toNot_equal_int_long_long {
  assertPass(test_expect((int)0).toNot.equal(1ll));
  assertFail(test_expect((int)0).toNot.equal(0ll), @"expected: not 0, got: 0");
}

- (void)test_equal_float {
  assertPass(test_expect(0.1f).equal(0.1f));
  assertFail(test_expect(0.1f).equal(0.2f), @"expected: 0.2, got: 0.1");
}

- (void)test_toNot_equal_float {
  assertPass(test_expect(0.1f).toNot.equal(0.2f));
  assertFail(test_expect(0.1f).toNot.equal(0.1f), @"expected: not 0.1, got: 0.1");
}

- (void)test_equal_double {
  assertPass(test_expect(0.1).equal(0.1));
  assertFail(test_expect(0.1).equal(0.2), @"expected: 0.2, got: 0.1");
}

- (void)test_toNot_equal_double {
  assertPass(test_expect(0.1).toNot.equal(0.2));
  assertFail(test_expect(0.1).toNot.equal(0.1), @"expected: not 0.1, got: 0.1");
}

- (void)test_equal_float_double {
  assertPass(test_expect(0.1f).equal(0.1));
  assertFail(test_expect(0.1f).equal(0.2), @"expected: 0.2, got: 0.1");
}

- (void)test_toNot_equal_float_double {
  assertPass(test_expect(0.1f).toNot.equal(0.2));
  assertFail(test_expect(0.1f).toNot.equal(0.1), @"expected: not 0.1, got: 0.1");
}

- (void)test_equal_pointer {
  int num = 1, num2 = 1;
  int *a = &num, *b = &num2;
  assertPass(test_expect(a).equal(&num));
  assertPass(test_expect(a).toNot.equal(b));
}

- (void)test_equal_nullPointer {
  int *nullPointer = NULL;
  assertPass(test_expect(nullPointer).equal(NULL));
}

- (void)test_equal_block {
  void (^block)(void) = ^{};
  void (^block2)(void) = ^{};
  assertPass(test_expect(block).equal(block));
  assertPass(test_expect(block).toNot.equal(block2));
}

- (void)test_equal_decimal_to_number {
  NSDecimalNumber *decimalNumber=[NSDecimalNumber decimalNumberWithString:@"1.07"];
  NSNumber *number = @1.07;
  assertPass(test_expect(decimalNumber).equal(number));
  assertPass(test_expect(number).equal(decimalNumber));
  assertPass(test_expect(@1.071).toNot.equal(decimalNumber));
}

typedef struct SomeFloatPair {
    float x;
    float y;
} SomeFloatPair;

- (void)test_equal_SomeFloatPair {
    SomeFloatPair a = {1.0f, 2.0f};
    SomeFloatPair b = {1.0f, 2.0f};
    assertPass(test_expect(a).equal(b));
}

typedef struct SomeFloatQuad {
    float a;
    float b;
    float c;
    float d;
} SomeFloatQuad;

- (void)test_equal_SomeFloatQuad {
    SomeFloatQuad a = {1.0f, 2.0f, 3.0f, 4.0f};
    SomeFloatQuad b = {1.0f, 2.0f, 3.0f, 4.0f};
    assertPass(test_expect(a).equal(b));
}

typedef struct SomeDoublePair {
    double x;
    double y;
} SomeDoublePair;

- (void)test_equal_SomeDoublePair {
    SomeDoublePair a = {1.0, 2.0};
    SomeDoublePair b = {1.0, 2.0};
    assertPass(test_expect(a).equal(b));
}

typedef struct SomeDoubleQuad {
    double a;
    double b;
    double c;
    double d;
} SomeDoubleQuad;

- (void)test_equal_SomeDoubleQuad {
    SomeDoubleQuad a = {1.0, 2.0, 3.0, 4.0};
    SomeDoubleQuad b = {1.0, 2.0, 3.0, 4.0};
    assertPass(test_expect(a).equal(b));
}

typedef struct SomeDoublePairPair {
    SomeDoublePair firstly;
    SomeDoublePair secondly;
} SomeDoublePairPair;

- (void)test_equal_SomeDoublePairPair {
    SomeDoublePairPair a = {{1.0, 2.0}, {3.0, 4.0}};
    SomeDoublePairPair b = {{1.0, 2.0}, {3.0, 4.0}};
    assertPass(test_expect(a).equal(b));
}

typedef struct SomeFloatPairPair {
    SomeFloatPair theOne;
    SomeFloatPair theOtherOne;
} SomeFloatPairPair;

- (void)test_equal_SomeFloatPairPair {
    SomeFloatPairPair a = {{1.0f, 2.0f}, {3.0f, 4.0f}};
    SomeFloatPairPair b = {{1.0f, 2.0f}, {3.0f, 4.0f}};
    assertPass(test_expect(a).equal(b));
}

- (void)test_duplicated_descriptions_provide_more_context {
    NSURL *url = [NSURL URLWithString:@"http://hello.world"];
    assertFail(test_expect(@"http://hello.world").equal(url), @"expected (NSURL): http://hello.world, got (__NSCFConstantString): http://hello.world");
}


@end
