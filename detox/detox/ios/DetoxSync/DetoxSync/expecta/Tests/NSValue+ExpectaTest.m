#import "TestHelper.h"
#import "NSValue+Expecta.h"

@interface NSValue_ExpectaTest : XCTestCase
@end

@implementation NSValue_ExpectaTest

- (void)test_EXP_objcType {
  int *a;
  char *b;
  NSValue *foo = [NSValue valueWithPointer:&a];
  NSValue *bar = [NSValue valueWithPointer:&b];
  [foo set_EXP_objCType:@encode(int)];
  [bar set_EXP_objCType:@encode(char)];
  assertTrue(strcmp([foo _EXP_objCType], @encode(int)) == 0);
  assertTrue(strcmp([bar _EXP_objCType], @encode(char)) == 0);
}

@end
