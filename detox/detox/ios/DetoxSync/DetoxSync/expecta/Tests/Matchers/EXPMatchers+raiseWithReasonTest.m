#import "TestHelper.h"

@interface EXPMatchers_raiseWithReasonTest : XCTestCase
@end

@implementation EXPMatchers_raiseWithReasonTest

- (void)test_raiseWithReason {
    assertPass(test_expect(^{
        [NSException raise:@"TestException" format:@"This is the reason"];
    }).to.raiseWithReason(@"TestException", @"This is the reason"));
    
    assertFail(test_expect(^{
        // not raising...
    }).to.raiseWithReason(@"TestException", @"This is the reason"), @"expected: TestException (This is the reason), got: no exception ()");
    
    assertFail(test_expect(^{
        NSException *exception = [NSException exceptionWithName:@"AnotherException" reason:@"This is the reason" userInfo:nil];
        [exception raise];
    }).to.raiseWithReason(@"TestException", @"This is the reason"), @"expected: TestException (This is the reason), got: AnotherException (This is the reason)");
}

- (void)test_toNot_raiseWithReason {
    assertFail(test_expect(^{
        [NSException raise:@"TestException" format:@"This is the reason"];
    }).notTo.raiseWithReason(@"TestException", @"This is the reason"), @"expected: not TestException (not 'This is the reason'), got: TestException (This is the reason)");
    
    assertPass(test_expect(^{
        // Different reason text than expected
        [NSException raise:@"TestException" format:@"A different reason"];
    }).notTo.raiseWithReason(@"TestException", @"This is the reason"));
    
    assertPass(test_expect(^{
        // not raising...
    }).notTo.raiseWithReason(@"TestException", @"This is the reason"));
    
    assertPass(test_expect(^{
        // Different exception class
        NSException *exception = [NSException exceptionWithName:@"AnotherException" reason:nil userInfo:nil];
        [exception raise];
    }).notTo.raiseWithReason(@"TestException", @"This is the reason"));
}

@end
