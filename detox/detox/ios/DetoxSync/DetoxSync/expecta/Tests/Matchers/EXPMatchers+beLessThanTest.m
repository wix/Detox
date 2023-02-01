#import "TestHelper.h"
#import "NSValue+Expecta.h"

@interface EXPMatchers_beLessThanTest : XCTestCase
@end

@implementation EXPMatchers_beLessThanTest

- (void)test_beLessThan {
    assertPass(test_expect(2).beLessThan(3));
    assertPass(test_expect(2.3).beLessThan(2.8));
    assertPass(test_expect(@2).beLessThan(@3));

    assertFail(test_expect(3).beLessThan(3), @"expected: 3 to be less than 3");
    assertFail(test_expect(3.5).beLessThan(3.5), @"expected: 3.5 to be less than 3.5");
    assertFail(test_expect(@3).beLessThan(@3), @"expected: 3 to be less than 3");

    assertFail(test_expect(3).beLessThan(2), @"expected: 3 to be less than 2");
    assertFail(test_expect(3.8).beLessThan(3.2), @"expected: 3.8 to be less than 3.2");
    assertFail(test_expect(@3).beLessThan(@2), @"expected: 3 to be less than 2");
}

- (void)test_toNot_beLessThan {
    assertPass(test_expect(3).toNot.beLessThan(2));
    assertPass(test_expect(3.8).toNot.beLessThan(3.2));
    assertPass(test_expect(@3).toNot.beLessThan(@2));

    assertFail(test_expect(2).toNot.beLessThan(3), @"expected: 2 not to be less than 3");
    assertFail(test_expect(3.2).toNot.beLessThan(3.8), @"expected: 3.2 not to be less than 3.8");
    assertFail(test_expect(@2).toNot.beLessThan(@3), @"expected: 2 not to be less than 3");
}

@end
