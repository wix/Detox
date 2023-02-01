#import "TestHelper.h"
#import "SpectaUtility.h"

SpecBegin(_SpectaUtilityTest)
SpecEnd

@interface SpectaUtilityTest : XCTestCase
@end

@implementation SpectaUtilityTest

- (void)test_spt_spt_isSpecClass_returns_yes_when_provided_a_spec_class {
  assertTrue(spt_isSpecClass([_SpectaUtilityTestSpec class]));
}

- (void)test_spt_spt_isSpecClass_returns_no_when_provided_a_XCTest_class {
  assertFalse(spt_isSpecClass([SpectaUtilityTest class]));
}

@end
