#import "TestHelper.h"

static int
  beforeAllRan
, beforeAll2Ran
, example1RanCorrectly
, example2RanCorrectly
, afterAllRan
, afterAll2Ran
;

SpecBegin(_CompilationTest7)

describe(@"group", ^{
  beforeAll(^{
    beforeAllRan ++;
  });

  beforeAll(^{
    beforeAll2Ran ++;
  });

  it(@"example 1", ^{
    if (beforeAllRan == 1 && beforeAll2Ran == 1 &&
       afterAllRan == 0 && afterAll2Ran == 0) {
      example1RanCorrectly ++;
    }
  });

  it(@"example 2", ^{
    if (beforeAllRan == 1 && beforeAll2Ran == 1 &&
       afterAllRan == 0 && afterAll2Ran == 0) {
      example2RanCorrectly ++;
    }
  });

  afterAll(^{
    afterAllRan ++;
  });

  afterAll(^{
    afterAll2Ran ++;
  });
});

SpecEnd

@interface CompilationTest7 : XCTestCase; @end
@implementation CompilationTest7

- (void)testMultipleBeforeAllAndAfterAllHooks {
  beforeAllRan = afterAllRan = example1RanCorrectly = example2RanCorrectly = beforeAll2Ran = afterAll2Ran = 0;

  RunSpec(_CompilationTest7Spec);

  assertEqual(example1RanCorrectly, 1);
  assertEqual(example2RanCorrectly, 1);

  assertEqual(beforeAllRan, 1);
  assertEqual(beforeAll2Ran, 1);
  assertEqual(afterAllRan, 1);
  assertEqual(afterAll2Ran, 1);
}

@end
