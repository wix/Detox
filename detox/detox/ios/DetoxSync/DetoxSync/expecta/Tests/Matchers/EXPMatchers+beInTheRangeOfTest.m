#import "TestHelper.h"

@interface EXPMatchers_beInTheRangeOfTest : XCTestCase
@end

@implementation EXPMatchers_beInTheRangeOfTest

- (void)test_beInTheRangeOf {
    assertPass(test_expect(1).beInTheRangeOf(1,10));
    assertPass(test_expect(10).beInTheRangeOf(1,10));
    assertPass(test_expect(5).beInTheRangeOf(1,10));

    assertPass(test_expect(1.0).beInTheRangeOf(1.0,10.0));
    assertPass(test_expect(10.0).beInTheRangeOf(1.0,10.0));
    assertPass(test_expect(5.0).beInTheRangeOf(1.0,10.0));

    assertPass(test_expect(1).beInTheRangeOf(1.0,10.0));
    assertPass(test_expect(10).beInTheRangeOf(1.0,10.0));
    assertPass(test_expect(5).beInTheRangeOf(1.0,10.0));

    assertPass(test_expect(1.0).beInTheRangeOf(1,10));
    assertPass(test_expect(10.0).beInTheRangeOf(1,10));
    assertPass(test_expect(5.0).beInTheRangeOf(1,10));

    assertPass(test_expect(@1).beInTheRangeOf(1, 10));
    assertPass(test_expect(@10).beInTheRangeOf(1, 10));
    assertPass(test_expect(@5).beInTheRangeOf(1, 10));
    assertPass(test_expect(@1).beInTheRangeOf(1.0, 10.0));
    assertPass(test_expect(@10).beInTheRangeOf(1.0, 10.0));
    assertPass(test_expect(@5).beInTheRangeOf(1.0, 10.0));
}

- (void)test_toNot_beInTheRangeOf {
    assertPass(test_expect(0).toNot.beInTheRangeOf(1,10));
    assertPass(test_expect(11).toNot.beInTheRangeOf(1,10));

    assertPass(test_expect(0.0).toNot.beInTheRangeOf(1.0,10.0));
    assertPass(test_expect(11.0).toNot.beInTheRangeOf(1.0,10.0));

    assertPass(test_expect(0).toNot.beInTheRangeOf(1.0,10.0));
    assertPass(test_expect(11).toNot.beInTheRangeOf(1.0,10.0));

    assertPass(test_expect(0.0).toNot.beInTheRangeOf(1,10));
    assertPass(test_expect(11.0).toNot.beInTheRangeOf(1,10));

    assertPass(test_expect(@0).toNot.beInTheRangeOf(1, 10));
    assertPass(test_expect(@11).toNot.beInTheRangeOf(1, 10));

    assertPass(test_expect(@0).toNot.beInTheRangeOf(1.0, 10.0));
    assertPass(test_expect(@11).toNot.beInTheRangeOf(1.0, 10.0));
}

@end
