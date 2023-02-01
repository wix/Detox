#import "TestHelper.h"
#import "SPTTestSuite.h"
#import "SPTExample.h"
#import "SPTExampleGroup.h"

static SPTVoidBlock
  block1 = ^{}
, block2 = ^{}
, block3 = ^{}
;

SpecBegin(_DSLTest5)

describe(@"group 1", ^{
  describe(@"group 2", ^{
    it(@"example 1", block1);
    example(@"example 2", block2);
  });

  specify(@"example 3", block3);
});

SpecEnd

@interface DSLTest5 : XCTestCase; @end
@implementation DSLTest5

- (void)testNestedExamples {
  SPTExampleGroup *rootGroup = [_DSLTest5Spec spt_testSuite].rootGroup;

  SPTExampleGroup *group1 = rootGroup.children[0];
  assertEqualObjects(group1.name, @"group 1");
  assertEqual([group1.children count], 2);

  SPTExampleGroup *group2 = group1.children[0];
  assertEqualObjects(group2.name, @"group 2");
  assertEqual([group2.children count], 2);

  SPTExample *example1 = group2.children[0];
  SPTExample *example2 = group2.children[1];
  SPTExample *example3 = group1.children[1];

  assertTrue([example1 isKindOfClass:[SPTExample class]]);
  assertTrue([example2 isKindOfClass:[SPTExample class]]);
  assertTrue([example3 isKindOfClass:[SPTExample class]]);

  assertEqualObjects(example1.name, @"example 1");
  assertEqualObjects(example2.name, @"example 2");
  assertEqualObjects(example3.name, @"example 3");

  assertEqualObjects(example1.block, block1);
  assertEqualObjects(example2.block, block2);
  assertEqualObjects(example3.block, block3);
}

@end
