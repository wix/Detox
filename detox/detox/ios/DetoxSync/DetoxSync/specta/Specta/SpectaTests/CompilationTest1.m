#import "TestHelper.h"

static int example1Ran;

SpecBegin(_CompilationTest1)

describe(@"group", ^{
  it(@"example 1", ^{
    example1Ran ++;
  });
});

SpecEnd

@interface CompilationTest1 : XCTestCase; @end
@implementation CompilationTest1

- (void)testSingleExample {
  example1Ran = 0;

  RunSpec(_CompilationTest1Spec);

  assertEqual(example1Ran, 1);
}

@end
