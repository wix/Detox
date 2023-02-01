#import "TestHelper.h"
#import "SPTTestSuite.h"
#import "SPTExampleGroup.h"

SpecBegin(_DSLTest3)

describe(@"group 1", ^{
  context(@"group 2", ^{});
  describe(@"group 3", ^{});
});

context(@"group 4", ^{});

SpecEnd

@interface DSLTest3 : XCTestCase; @end
@implementation DSLTest3

- (void)testNestedExampleGroups {
  SPTExampleGroup *rootGroup = [_DSLTest3Spec spt_testSuite].rootGroup;
  assertEqual([rootGroup.children count], 2);

  SPTExampleGroup *group1 = rootGroup.children[0];
  assertTrue([group1 isKindOfClass:[SPTExampleGroup class]]);
  assertEqualObjects(group1.name, @"group 1");
  assertEqualObjects(group1.parent, rootGroup);
  assertEqualObjects(group1.root, rootGroup);
  assertEqual([group1.children count], 2);

  SPTExampleGroup *group2 = group1.children[0];
  SPTExampleGroup *group3 = group1.children[1];

  assertTrue([group2 isKindOfClass:[SPTExampleGroup class]]);
  assertTrue([group3 isKindOfClass:[SPTExampleGroup class]]);
  assertEqualObjects(group2.name, @"group 2");
  assertEqualObjects(group3.name, @"group 3");
  assertEqualObjects(group2.parent, group1);
  assertEqualObjects(group3.parent, group1);
  assertEqualObjects(group2.root, rootGroup);
  assertEqualObjects(group3.root, rootGroup);

  SPTExampleGroup *group4 = rootGroup.children[1];
  assertTrue([group4 isKindOfClass:[SPTExampleGroup class]]);
  assertEqualObjects(group4.name, @"group 4");
  assertEqualObjects(group4.parent, rootGroup);
  assertEqualObjects(group4.root, rootGroup);
}

@end
