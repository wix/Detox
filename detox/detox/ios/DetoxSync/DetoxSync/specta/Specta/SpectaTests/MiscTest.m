#import "TestHelper.h"

@interface XCTestCase (MiscTest)

+ (NSArray *)allSubclasses;

@end

SpecBegin(_MiscTest)

describe(@"group", ^{
});

SpecEnd

@interface MiscTest : XCTestCase; @end
@implementation MiscTest

- (void)test_MiscTestSpecInXCTestCaseSubClassList {
  assertTrue([[XCTestCase allSubclasses] indexOfObject:[_MiscTestSpec class]] != NSNotFound);
}

- (void)testSPTSpecNotInXCTestCaseSubClassList {
  // trick XCTestCase into thinking SPTSpec is not a subclass of XCTestCase
  assertTrue([[XCTestCase allSubclasses] indexOfObject:[SPTSpec class]] == NSNotFound);
}

@end
