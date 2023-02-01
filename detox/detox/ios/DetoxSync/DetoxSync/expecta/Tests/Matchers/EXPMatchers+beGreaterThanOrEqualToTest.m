#import "TestHelper.h"
#import "NSValue+Expecta.h"

@interface EXPMatchers_beGreaterThanOrEqualToTest : XCTestCase
@end

@implementation EXPMatchers_beGreaterThanOrEqualToTest

- (void)test_beGreaterThanOrEqualTo {
    assertPass(test_expect(3).beGreaterThanOrEqualTo(2));
    assertPass(test_expect(2).beGreaterThanOrEqualTo(2));
    assertPass(test_expect(2.1).beGreaterThanOrEqualTo(2));
    assertPass(test_expect(3.14).beGreaterThanOrEqualTo(3.14));

    assertPass(test_expect(@3).beGreaterThanOrEqualTo(@2));
    assertPass(test_expect(@2.7f).beGreaterThanOrEqualTo(@2));

    assertFail(test_expect(2).beGreaterThanOrEqualTo(3), @"expected: 2 to be greater than or equal to 3");
    assertFail(test_expect(3.2).beGreaterThanOrEqualTo(3.5), @"expected: 3.2 to be greater than or equal to 3.5");
    assertFail(test_expect(@3).beGreaterThanOrEqualTo(@4), @"expected: 3 to be greater than or equal to 4");
}

- (void)test_toNot_beGreaterThanOrEqualTo {
    assertPass(test_expect(3).toNot.beGreaterThanOrEqualTo(5));
    assertPass(test_expect(3.8).toNot.beGreaterThanOrEqualTo(3.9));
    assertPass(test_expect(@3).toNot.beGreaterThanOrEqualTo(@4));

    assertFail(test_expect(3).toNot.beGreaterThanOrEqualTo(2), @"expected: 3 not to be greater than or equal to 2");
    assertFail(test_expect(3.2).toNot.beGreaterThanOrEqualTo(3.14), @"expected: 3.2 not to be greater than or equal to 3.14");
    assertFail(test_expect(@3).toNot.beGreaterThanOrEqualTo(@3), @"expected: 3 not to be greater than or equal to 3");
}

@end
