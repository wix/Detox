#import "TestHelper.h"
#import "SPTTestSuite.h"
#import "SPTExampleGroup.h"

SpecBegin(_DSLTest1)

describe(@"group", ^{});

SpecEnd

@interface DSLTest1 : XCTestCase; @end
@implementation DSLTest1

- (void)testSingleExampleGroup {
  SPTExampleGroup *rootGroup = [_DSLTest1Spec spt_testSuite].rootGroup;

  assertTrue([rootGroup isKindOfClass:[SPTExampleGroup class]]);
  assertEqualObjects(rootGroup.root, rootGroup);
  assertNil(rootGroup.parent);

  assertEqual([rootGroup.children count], 1);
  SPTExampleGroup *group = rootGroup.children[0];
  assertEqualObjects(group.name, @"group");
  assertEqualObjects(group.parent, rootGroup);
  assertEqualObjects(group.root, rootGroup);
}

@end
