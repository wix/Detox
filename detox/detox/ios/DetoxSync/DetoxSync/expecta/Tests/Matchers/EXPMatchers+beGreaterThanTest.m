#import "TestHelper.h"
#import "NSValue+Expecta.h"

@interface EXPMatchers_beGreaterThanTest : XCTestCase
@end

@implementation EXPMatchers_beGreaterThanTest

- (void)test_beGreaterThan {
    assertPass(test_expect(3).beGreaterThan(2));
    assertPass(test_expect(3.1).beGreaterThan(3));
    assertPass(test_expect(2.9).beGreaterThan(2.8));
    assertPass(test_expect(@4).beGreaterThan(@3));

    assertFail(test_expect(3).beGreaterThan(3), @"expected: 3 to be greater than 3");
    assertFail(test_expect(3.5).beGreaterThan(3.5), @"expected: 3.5 to be greater than 3.5");
    assertFail(test_expect(@3).beGreaterThan(@3), @"expected: 3 to be greater than 3");

    assertFail(test_expect(2).beGreaterThan(3), @"expected: 2 to be greater than 3");
    assertFail(test_expect(3.1).beGreaterThan(3.2), @"expected: 3.1 to be greater than 3.2");
    assertFail(test_expect(@3).beGreaterThan(@4), @"expected: 3 to be greater than 4");
}

- (void)test_toNot_beGreaterThan {
    assertPass(test_expect(2).toNot.beGreaterThan(3));
    assertPass(test_expect(3.8).toNot.beGreaterThan(3.9));
    assertPass(test_expect(@3).toNot.beGreaterThan(@4));

    assertFail(test_expect(2).toNot.beGreaterThan(1), @"expected: 2 not to be greater than 1");
    assertFail(test_expect(3.9).toNot.beGreaterThan(3.8), @"expected: 3.9 not to be greater than 3.8");
    assertFail(test_expect(@4).toNot.beGreaterThan(@3), @"expected: 4 not to be greater than 3");
}

@end
