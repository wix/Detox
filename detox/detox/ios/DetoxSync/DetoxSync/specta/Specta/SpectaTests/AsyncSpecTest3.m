#import "TestHelper.h"

static NSString
  *foo = @"foo"
, *bar = @"bar"
;

SpecBegin(_AsyncSpecTest3)

describe(@"beforeEach", ^{
  beforeEach(^{
    waitUntil(^(DoneCallback done) {
      dispatch_async(dispatch_get_main_queue(), ^{
        assertEqualObjects(foo, @"foo");
        done();
      });
    });
  });

  it(@"example", ^{
    assertFalse(NO);
  });
});

describe(@"afterEach", ^{
  afterEach(^{
    waitUntil(^(DoneCallback done) {
      dispatch_async(dispatch_get_main_queue(), ^{
        assertEqualObjects(foo, @"foo");
        done();
      });
    });
  });

  it(@"example", ^{
    assertFalse(NO);
  });
});

describe(@"beforeAll", ^{
  beforeAll(^{
    waitUntil(^(DoneCallback done) {
      dispatch_async(dispatch_get_main_queue(), ^{
        assertEqualObjects(foo, @"foo");
        done();
      });
    });
  });

  it(@"example", ^{
    assertFalse(NO);
  });
});

describe(@"afterAll", ^{
  beforeAll(^{
    waitUntil(^(DoneCallback done) {
      dispatch_async(dispatch_get_main_queue(), ^{
        assertEqualObjects(foo, @"foo");
        done();
      });
    });
  });

  it(@"example", ^{
    assertFalse(NO);
  });
});

SpecEnd

@interface AsyncSpecTest3 : XCTestCase; @end
@implementation AsyncSpecTest3

- (void)testFailingHooks {
  foo = @"not foo";
  bar = @"not bar";
  XCTestRun *result = RunSpec(_AsyncSpecTest3Spec);
  assertEqual([result unexpectedExceptionCount], 0);
  assertEqual([result failureCount], 4);
  assertFalse([result hasSucceeded]);
  foo = @"foo";
  bar = @"bar";
}

@end
