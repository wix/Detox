#import "TestHelper.h"

static int
  beforeAllRan
, beforeEachRan
, example1RanCorrectly
, example2RanCorrectly
, afterEachRan
, afterAllRan
;

SpecBegin(_CompilationTest6)

describe(@"group", ^{
  beforeAll(^{
    beforeAllRan ++;
  });

  beforeEach(^{
    beforeEachRan ++;
  });

  it(@"example 1", ^{
    if (beforeAllRan == 1 && beforeEachRan == 1 &&
       afterEachRan == 0 && afterAllRan == 0) {
      example1RanCorrectly ++;
    }
  });

  it(@"example 2", ^{
    if (beforeAllRan == 1 && beforeEachRan == 2 &&
       afterEachRan == 1 && afterAllRan == 0) {
      example2RanCorrectly ++;
    }
  });

  afterEach(^{
    afterEachRan ++;
  });

  afterAll(^{
    afterAllRan ++;
  });
});

SpecEnd

@interface CompilationTest6 : XCTestCase; @end
@implementation CompilationTest6

- (void)testBeforeAllAndAfterAllHooks {
  beforeEachRan = afterEachRan = example1RanCorrectly = example2RanCorrectly = beforeAllRan = afterAllRan = 0;

  RunSpec(_CompilationTest6Spec);

  assertEqual(example1RanCorrectly, 1);
  assertEqual(example2RanCorrectly, 1);

  assertEqual(beforeAllRan, 1);
  assertEqual(beforeEachRan, 2);
  assertEqual(afterEachRan, 2);
  assertEqual(afterAllRan, 1);
}

@end
