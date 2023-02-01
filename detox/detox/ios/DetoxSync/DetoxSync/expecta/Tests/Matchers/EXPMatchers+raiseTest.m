#import "TestHelper.h"

@interface EXPMatchers_raiseTest : XCTestCase
@end

@implementation EXPMatchers_raiseTest

- (void)test_raise {
  assertPass(test_expect(^{
    [NSException raise:@"TestException" format:@""];
  }).to.raiseAny());

  assertPass(test_expect(^{
    [NSException raise:@"TestException" format:@""];
  }).to.raise(@"TestException"));

  assertFail(test_expect(^{
    // not raising...
  }).to.raise(@"TestException"), @"expected: TestException, got: no exception");

  assertFail(test_expect(^{
    NSException *exception = [NSException exceptionWithName:@"AnotherException" reason:nil userInfo:nil];
    [exception raise];
  }).to.raise(@"TestException"), @"expected: TestException, got: AnotherException");
}

- (void)test_toNot_raise {
  assertFail(test_expect(^{
    [NSException raise:@"TestException" format:@""];
  }).notTo.raiseAny(), @"expected: no exception, got: TestException");

  assertFail(test_expect(^{
    [NSException raise:@"TestException" format:@""];
  }).notTo.raise(@"TestException"), @"expected: not TestException, got: TestException");

  assertPass(test_expect(^{
    // not raising...
  }).notTo.raise(@"TestException"));

  assertPass(test_expect(^{
    NSException *exception = [NSException exceptionWithName:@"AnotherException" reason:nil userInfo:nil];
    [exception raise];
  }).notTo.raise(@"TestException"));
}

@end
