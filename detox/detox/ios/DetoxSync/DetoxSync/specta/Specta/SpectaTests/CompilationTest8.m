#import "TestHelper.h"
#import "SPTSpec.h"
#import "SPTTestSuite.h"

SpecBegin(_CompilationTest8)

describe(@"group 1", ^{
  describe(@"group 2", ^{
    describe(@"group 3", ^{
      it(@"example 1", ^{});
      it(@"example 2", ^{});
    });
    it(@"example 3", ^{});
  });
  it(@"example 4", ^{});
  it(@"example 5", ^{});
  describe(@"group 4", ^{
    it(@"example 6", ^{});
  });
});

SpecEnd

@interface CompilationTest8 : XCTestCase; @end
@implementation CompilationTest8

- (void)testCompiledExampleNames {
  RunSpec(_CompilationTest8Spec);
  SPTTestSuite *testSuite = [_CompilationTest8Spec spt_testSuite];
  NSArray *compiledExamples = testSuite.compiledExamples;

  assertEqualObjects([compiledExamples[0] name], @"group 1 group 2 group 3 example 1");
  assertEqualObjects([compiledExamples[1] name], @"group 1 group 2 group 3 example 2");
  assertEqualObjects([compiledExamples[2] name], @"group 1 group 2 example 3");
  assertEqualObjects([compiledExamples[3] name], @"group 1 example 4");
  assertEqualObjects([compiledExamples[4] name], @"group 1 example 5");
  assertEqualObjects([compiledExamples[5] name], @"group 1 group 4 example 6");
}

@end
