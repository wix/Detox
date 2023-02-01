#import "TestHelper.h"
#import "SPTTestSuite.h"
#import "SPTExampleGroup.h"
#import "SPTExample.h"

static SPTVoidBlock
  block1 = ^{}
, block2 = ^{}
, block3 = ^{}
;

SpecBegin(_DSLTest4)

describe(@"group", ^{
  it(@"example 1", block1);
  example(@"example 2", block2);
  specify(@"example 3", block3);
});

SpecEnd

@interface DSLTest4 : XCTestCase; @end
@implementation DSLTest4

- (void)testExamples {
  SPTExampleGroup *rootGroup = [_DSLTest4Spec spt_testSuite].rootGroup;
  SPTExampleGroup *group = rootGroup.children[0];

  assertEqual([group.children count], 3);

  SPTExample *example1 = group.children[0];
  SPTExample *example2 = group.children[1];
  SPTExample *example3 = group.children[2];

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
