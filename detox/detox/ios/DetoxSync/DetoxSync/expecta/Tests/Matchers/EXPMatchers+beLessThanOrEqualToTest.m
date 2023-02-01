#import "TestHelper.h"
#import "NSValue+Expecta.h"

@interface EXPMatchers_beLessThanOrEqualToTest : XCTestCase
@end

@implementation EXPMatchers_beLessThanOrEqualToTest

- (void)test_beLessThanOrEqualTo {
    assertPass(test_expect(2).beLessThanOrEqualTo(3));
    assertPass(test_expect(2).beLessThanOrEqualTo(2));
    assertPass(test_expect(2).beLessThanOrEqualTo(2.1));
    assertPass(test_expect(3.14).beLessThanOrEqualTo(3.14));

    assertPass(test_expect(@2).beLessThanOrEqualTo(@3));
    assertPass(test_expect(@2).beLessThanOrEqualTo(@2.4f));

    assertFail(test_expect(3).beLessThanOrEqualTo(2), @"expected: 3 to be less than or equal to 2");
    assertFail(test_expect(3.8).beLessThanOrEqualTo(3.2), @"expected: 3.8 to be less than or equal to 3.2");
    assertFail(test_expect(@3).beLessThanOrEqualTo(@2), @"expected: 3 to be less than or equal to 2");
}

- (void)test_toNot_beLessThanOrEqualTo {
    assertPass(test_expect(3).toNot.beLessThanOrEqualTo(2));
    assertPass(test_expect(3.8).toNot.beLessThanOrEqualTo(3.2));
    assertPass(test_expect(@3).toNot.beLessThanOrEqualTo(@2));

    assertFail(test_expect(2).toNot.beLessThanOrEqualTo(3), @"expected: 2 not to be less than or equal to 3");
    assertFail(test_expect(3.2).toNot.beLessThanOrEqualTo(3.8), @"expected: 3.2 not to be less than or equal to 3.8");
    assertFail(test_expect(@2).toNot.beLessThanOrEqualTo(@3), @"expected: 2 not to be less than or equal to 3");
}

@end
