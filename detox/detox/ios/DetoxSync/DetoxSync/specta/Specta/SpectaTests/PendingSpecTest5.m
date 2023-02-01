#import "TestHelper.h"

static int
beforeAllRan
, afterAllRan
;

SpecBegin(_PendingSpecTest5)

describe(@"group", ^{
  beforeAll(^{
    beforeAllRan ++;
  });

  pending(@"pending 1", ^{ });
  pending(@"pending 2", ^{ });

  it(@"example 1", ^{ });
  it(@"example 2", ^{ });

  pending(@"pending 3", ^{ });
  pending(@"pending 4", ^{ });

  afterAll(^{
    afterAllRan ++;
  });
});

SpecEnd

@interface PendingSpecTest5 : XCTestCase; @end
@implementation PendingSpecTest5

- (void)testPendingSpec {
  beforeAllRan = afterAllRan = 0;

  RunSpec(_PendingSpecTest5Spec);

  assertEqual(beforeAllRan, 1);
  assertEqual(afterAllRan, 1);
}

@end
