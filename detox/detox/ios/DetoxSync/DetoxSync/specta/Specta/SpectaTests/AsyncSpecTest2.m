#import "TestHelper.h"

static int
  beforeAllRan
, beforeEachRan
, example1RanCorrectly
, example2RanCorrectly
, afterEachRan
, afterAllRan
;

SpecBegin(_AsyncSpecTest2)

describe(@"group", ^{
  beforeAll(^{
    waitUntil(^(DoneCallback done) {
      beforeAllRan ++;
      done();
    });
  });

  beforeEach(^{
    waitUntil(^(DoneCallback done) {
      beforeEachRan ++;
      done();
    });
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
    waitUntil(^(DoneCallback done) {
      afterEachRan ++;
      done();
    });
  });

  afterAll(^{
    waitUntil(^(DoneCallback done) {
      afterAllRan ++;
      done();
    });
  });
});

SpecEnd

@interface AsyncSpecTest2 : XCTestCase; @end
@implementation AsyncSpecTest2

- (void)testBeforeAllAndAfterAllHooks {
  beforeEachRan = afterEachRan = example1RanCorrectly = example2RanCorrectly = beforeAllRan = afterAllRan = 0;

  RunSpec(_AsyncSpecTest2Spec);

  assertEqual(example1RanCorrectly, 1);
  assertEqual(example2RanCorrectly, 1);

  assertEqual(beforeAllRan, 1);
  assertEqual(beforeEachRan, 2);
  assertEqual(afterEachRan, 2);
  assertEqual(afterAllRan, 1);
}

@end
