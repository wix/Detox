#import "TestHelper.h"

@interface EXPMatchers_beCloseToTest : XCTestCase
@end

@implementation EXPMatchers_beCloseToTest

- (void)test_beCloseTo {
  assertPass(test_expect(67329.234).to.beCloseTo(67329.242));
  assertPass(test_expect(0.05).to.beCloseToWithin(0.04, 0.01));
  assertPass(test_expect(0.04).to.beCloseToWithin(0.04, 0.01));
  assertPass(test_expect(0.03).to.beCloseToWithin(0.04, 0.01));

  assertFail(test_expect(0.1f).to.beCloseTo(0.2f), @"expected 0.1 to be close to 0.2");
  assertFail(test_expect(0.061).to.beCloseToWithin(0.05, 0.01), @"expected 0.061 to be close to 0.05 within 0.01");
  assertFail(test_expect(0.039).to.beCloseToWithin(0.05, 0.01), @"expected 0.039 to be close to 0.05 within 0.01");
}

- (void)test_notTo_beCloseTo {
  assertFail(test_expect(67329.234).notTo.beCloseTo(67329.242), @"expected 67329.234 not to be close to 67329.242");
  assertFail(test_expect(0.05).notTo.beCloseToWithin(0.04, 0.01), @"expected 0.05 not to be close to 0.04 within 0.01");
  assertFail(test_expect(0.04).notTo.beCloseToWithin(0.04, 0.01), @"expected 0.04 not to be close to 0.04 within 0.01");
  assertFail(test_expect(0.03).notTo.beCloseToWithin(0.04, 0.01), @"expected 0.03 not to be close to 0.04 within 0.01");

  assertPass(test_expect(0.1f).notTo.beCloseTo(0.2f));
  assertPass(test_expect(0.061).notTo.beCloseToWithin(0.05, 0.01));
  assertPass(test_expect(0.039).notTo.beCloseToWithin(0.05, 0.01));
}

@end
