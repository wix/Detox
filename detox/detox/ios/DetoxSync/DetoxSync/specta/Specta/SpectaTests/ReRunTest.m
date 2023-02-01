#import "TestHelper.h"

static int
  beforeAllRan
, beforeEachRan
, example1Ran
, example2Ran
, afterEachRan
, afterAllRan
;

SpecBegin(_ReRunTest)

describe(@"group", ^{
  beforeAll(^{
    beforeAllRan ++;
  });

  beforeEach(^{
    beforeEachRan ++;
  });

  it(@"example 1", ^{
    example1Ran ++;
  });

  it(@"example 2", ^{
    example2Ran ++;
  });

  afterEach(^{
    afterEachRan ++;
  });

  afterAll(^{
    afterAllRan ++;
  });
});

SpecEnd

@interface ReRunTest : XCTestCase; @end
@implementation ReRunTest

- (void)test_Tests_should_be_able_to_run_multiple_times {
  beforeEachRan = afterEachRan = example1Ran = example2Ran = beforeAllRan = afterAllRan = 0;

  RunSpec(_ReRunTestSpec);

  assertEqual(example1Ran, 1);
  assertEqual(example2Ran, 1);

  assertEqual(beforeAllRan, 1);
  assertEqual(beforeEachRan, 2);
  assertEqual(afterEachRan, 2);
  assertEqual(afterAllRan, 1);

  RunSpec(_ReRunTestSpec);

  assertEqual(example1Ran, 2);
  assertEqual(example2Ran, 2);

  assertEqual(beforeAllRan, 2);
  assertEqual(beforeEachRan, 4);
  assertEqual(afterEachRan, 4);
  assertEqual(afterAllRan, 2);
}

@end
