#import "TestHelper.h"

static int
  example1Ran
, example2Ran
, example3Ran
, example4Ran
, example5Ran
, example6Ran
;

SpecBegin(_CompilationTest2)

describe(@"group", ^{
  it(@"example 1", ^{
    example1Ran ++;
  });

  it(@"example 2", ^{
    example2Ran ++;
  });

  example(@"example 3", ^{
    example3Ran ++;
  });

  specify(@"example 4", ^{
    example4Ran ++;
  });

  it(@"example with same name", ^{
    example5Ran ++;
  });

  it(@"example with same name", ^{
    example6Ran ++;
  });
});

SpecEnd

@interface CompilationTest2 : XCTestCase; @end
@implementation CompilationTest2

- (void)testMultipleExamples {
  example1Ran = example2Ran = example3Ran = example4Ran = 0;

  RunSpec(_CompilationTest2Spec);

  assertEqual(example1Ran, 1);
  assertEqual(example2Ran, 1);
  assertEqual(example3Ran, 1);
  assertEqual(example4Ran, 1);
  assertEqual(example5Ran, 1);
  assertEqual(example6Ran, 1);
}

@end
