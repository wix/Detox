#import "TestHelper.h"
#import "NSValue+Expecta.h"

@interface ExpectationTest : XCTestCase {
  EXPExpect *x;
  NSNumber *n;
  NSValue *v;
}
@end

@interface ExpectedObject : NSObject

+ (NSUInteger)instanceCount;

@end

@implementation ExpectedObject

// This method is declared to prevent "undeclared selector" compiler warnings
- (void)foo {}

- (instancetype)init {
  if (self = [super init]) {
    ++_instanceCount;
  }
  return self;
}

- (void)dealloc {
  --_instanceCount;
  [super dealloc];
}

static NSUInteger _instanceCount;

+ (NSUInteger)instanceCount {
  return _instanceCount;
}

@end

@implementation ExpectationTest

- (void)test_expect {
  x = expect(@"foo");
  assertEquals(x.lineNumber, (__LINE__ - 1));
  assertTrue(strcmp(x.fileName, __FILE__) == 0);
  assertEquals(x.testCase, self);
}

- (void)test_expect_NotTo {
  x = expect(@"foo");
  assertFalse(x.negative);
  x = expect(@"foo").notTo;
  assertTrue(x.negative);
  x = expect(@"foo").toNot;
  assertTrue(x.negative);
}

- (void)test_expect_nil {
  assertNil(expect(nil).actual);
}

- (void)test_expect_object {
  assertEqualObjects(expect(@"foo").actual, @"foo");
}

- (void)test_expect_SEL {
  v = [NSValue valueWithPointer:@selector(foo)];
  x = expect(@selector(foo));
  assertEqualObjects(x.actual, v);
  assertTrue(strcmp([(NSValue *)x.actual _EXP_objCType], @encode(SEL)) == 0);
}

- (void)test_expect_Class {
  assertEqualObjects(expect([EXPExpect class]).actual, [EXPExpect class]);
}

- (void)test_expect_CString {
  char *foo = "foo";
  v = [NSValue valueWithPointer:foo];
  assertEqualObjects(expect(foo).actual, v);
}

- (void)test_expect_char {
  char a = 127;
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_double {
  double a = 3.141592653589793;
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_float {
  float a = 3.141592f;
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_int {
  int a = 2147483647;
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_long {
#ifdef __LP64__
  long a = 9223372036854775807;
#else
  long a = 2147483647;
#endif
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_long_long {
  long long a = 9223372036854775807;
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_short {
  short a = 32767;
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_NSInteger {
#ifdef __LP64__
  NSInteger a = 9223372036854775807;
#else
  NSInteger a = 2147483647;
#endif
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_unsigned_char {
  unsigned char a = 255;
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_unsigned_int {
  unsigned int a = 4294967295;
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_unsigned_long {
#ifdef __LP64__
  unsigned long a = 18446744073709551615u;
#else
  unsigned long a = 4294967295;
#endif
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_unsigned_long_long {
  unsigned long long a = 18446744073709551615u;
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_unsigned_short {
  unsigned short a = 65535;
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_NSUInteger {
#ifdef __LP64__
  NSUInteger a = 18446744073709551615u;
#else
  NSUInteger a = 4294967295;
#endif
  n = @(a);
  assertEqualObjects(expect(a).actual, n);
}

- (void)test_expect_block {
  void (^b)(void) = ^{};
  void (^b2)(int a) = ^(int a) {};
  assertEqualObjects(expect(b).actual, b);
  assertEqualObjects(expect(b2).actual, b2);
}

- (void)test_expect_union {
  union u {
    int a;
    float b;
  } u;
  assertFail(test_expect(u).beNil(), @"expecting a union is not supported");
}

- (void)test_expect_struct {
  struct s {
    int a;
    float b;
  } s;
  assertFail(test_expect(s).beNil(), @"expecting a struct is not supported");
}

- (void)test_boolean_type_equivalence {
  bool noBool = false;
  BOOL noBOOL = NO;
  int noInt = 0;
  id noNSNum = @NO;
  
  _Bool yesBool = true;
  BOOL yesBOOL = YES;
  int yesInt = 1;
  id yesNSNum = @YES;
  
  expect(false).to.equal(NO);
  expect(NO).to.equal(noBool);
  expect(noBool).to.equal(noBOOL);
  expect(noBOOL).to.equal(noInt);
  expect(noInt).to.equal(noNSNum);
  
  expect(true).to.equal(YES);
  expect(YES).to.equal(yesBool);
  expect(yesBool).to.equal(yesBOOL);
  expect(yesBOOL).to.equal(yesInt);
  expect(yesInt).to.equal(yesNSNum);
}

- (void)test_expect_memory_management {
  NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
  ExpectedObject *object = [[[ExpectedObject alloc] init] autorelease];
  expect(object).to.equal(object);
  [pool drain];

  assertEquals([ExpectedObject instanceCount], 0);
}

@end
