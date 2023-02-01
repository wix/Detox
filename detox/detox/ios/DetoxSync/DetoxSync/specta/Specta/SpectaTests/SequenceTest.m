#import "TestHelper.h"
#import "SPTGlobalBeforeAfterEach.h"

static NSMutableArray *sequence = nil;

@interface SequenceTestHelper : NSObject <SPTGlobalBeforeAfterEach>
@end

@implementation SequenceTestHelper

+ (void)beforeEach {
  [sequence addObject:@"+beforeEach"];
}

+ (void)afterEach {
  [sequence addObject:@"+afterEach"];
}

@end

SpecBegin(_SequenceTest)

describe(@"root", ^{
  beforeAll(^{ [sequence addObject:@"/beforeAll"]; });
  beforeEach(^{ [sequence addObject:@"/beforeEach"]; });

  describe(@"foo", ^{
    beforeAll(^{ [sequence addObject:@"/foo/beforeAll"]; });
    beforeEach(^{ [sequence addObject:@"/foo/beforeEach"]; });

    context(@"bar", ^{
      beforeAll(^{ [sequence addObject:@"/foo/bar/beforeAll"]; });
      beforeEach(^{ [sequence addObject:@"/foo/bar/beforeEach"]; });

      it(@"is an example", ^{ [sequence addObject:@"/foo/bar/example1"]; });
      specify(@"an example", ^{ [sequence addObject:@"/foo/bar/example2"]; });

      afterEach(^{ [sequence addObject:@"/foo/bar/afterEach"]; });
      afterAll(^{ [sequence addObject:@"/foo/bar/afterAll"]; });
    });

    context(@"baz", ^{
      before(^{ [sequence addObject:@"/foo/baz/beforeEach"]; });

      it(@"is an example", ^{ [sequence addObject:@"/foo/baz/example1"]; });
      specify(@"an example", ^{ [sequence addObject:@"/foo/baz/example2"]; });

      after(^{ [sequence addObject:@"/foo/baz/afterEach"]; });
    });

    it(@"is an example", ^{ [sequence addObject:@"/foo/example1"]; });
    specify(@"an example", ^{ [sequence addObject:@"/foo/example2"]; });
    afterEach(^{ [sequence addObject:@"/foo/afterEach"]; });
    afterAll(^{ [sequence addObject:@"/foo/afterAll"]; });
  });

  it(@"is an example", ^{ [sequence addObject:@"/example1"]; });
  it(@"is another example", ^{ [sequence addObject:@"/example2"]; });
  example(@"is yet another example", ^{ [sequence addObject:@"/example3"]; });
  specify(@"an example", ^{ [sequence addObject:@"/example4"]; });

  afterEach(^{ [sequence addObject:@"/afterEach"]; });
  afterAll(^{ [sequence addObject:@"/afterAll"]; });
});

SpecEnd

#define assertSequence(i, obj) assertEqualObjects(sequence[i], obj); i++

@interface SequenceTest : XCTestCase
@end

@implementation SequenceTest

- (void)test_Tests_should_run_in_correct_sequence {
  sequence = [NSMutableArray array];
  [sequence removeAllObjects];

  RunSpec(_SequenceTestSpec);

  assertNotEqual([sequence count], 0);
  int i = 0;

  assertSequence(i, @"/beforeAll");
  // /foo
  assertSequence(i, @"/foo/beforeAll");
  // /foo/bar
  assertSequence(i, @"/foo/bar/beforeAll");

  // /foo/bar/example1
  assertSequence(i, @"+beforeEach");
  assertSequence(i, @"/beforeEach");
  assertSequence(i, @"/foo/beforeEach");
  assertSequence(i, @"/foo/bar/beforeEach");
  assertSequence(i, @"/foo/bar/example1");
  assertSequence(i, @"/foo/bar/afterEach");
  assertSequence(i, @"/foo/afterEach");
  assertSequence(i, @"/afterEach");
  assertSequence(i, @"+afterEach");

  // /foo/bar/example2
  assertSequence(i, @"+beforeEach");
  assertSequence(i, @"/beforeEach");
  assertSequence(i, @"/foo/beforeEach");
  assertSequence(i, @"/foo/bar/beforeEach");
  assertSequence(i, @"/foo/bar/example2");
  assertSequence(i, @"/foo/bar/afterEach");
  assertSequence(i, @"/foo/afterEach");
  assertSequence(i, @"/afterEach");
  assertSequence(i, @"+afterEach");
  assertSequence(i, @"/foo/bar/afterAll");

  // /foo/baz
  // /foo/baz/example1
  assertSequence(i, @"+beforeEach");
  assertSequence(i, @"/beforeEach");
  assertSequence(i, @"/foo/beforeEach");
  assertSequence(i, @"/foo/baz/beforeEach");
  assertSequence(i, @"/foo/baz/example1");
  assertSequence(i, @"/foo/baz/afterEach");
  assertSequence(i, @"/foo/afterEach");
  assertSequence(i, @"/afterEach");
  assertSequence(i, @"+afterEach");
  // /foo/baz/example2
  assertSequence(i, @"+beforeEach");
  assertSequence(i, @"/beforeEach");
  assertSequence(i, @"/foo/beforeEach");
  assertSequence(i, @"/foo/baz/beforeEach");
  assertSequence(i, @"/foo/baz/example2");
  assertSequence(i, @"/foo/baz/afterEach");
  assertSequence(i, @"/foo/afterEach");
  assertSequence(i, @"/afterEach");
  assertSequence(i, @"+afterEach");
  // /foo/example1
  assertSequence(i, @"+beforeEach");
  assertSequence(i, @"/beforeEach");
  assertSequence(i, @"/foo/beforeEach");
  assertSequence(i, @"/foo/example1");
  assertSequence(i, @"/foo/afterEach");
  assertSequence(i, @"/afterEach");
  assertSequence(i, @"+afterEach");
  // /foo/example2
  assertSequence(i, @"+beforeEach");
  assertSequence(i, @"/beforeEach");
  assertSequence(i, @"/foo/beforeEach");
  assertSequence(i, @"/foo/example2");
  assertSequence(i, @"/foo/afterEach");
  assertSequence(i, @"/afterEach");
  assertSequence(i, @"+afterEach");
  assertSequence(i, @"/foo/afterAll");
  // /example1
  assertSequence(i, @"+beforeEach");
  assertSequence(i, @"/beforeEach");
  assertSequence(i, @"/example1");
  assertSequence(i, @"/afterEach");
  assertSequence(i, @"+afterEach");
  // /example2
  assertSequence(i, @"+beforeEach");
  assertSequence(i, @"/beforeEach");
  assertSequence(i, @"/example2");
  assertSequence(i, @"/afterEach");
  assertSequence(i, @"+afterEach");
  // /example3
  assertSequence(i, @"+beforeEach");
  assertSequence(i, @"/beforeEach");
  assertSequence(i, @"/example3");
  assertSequence(i, @"/afterEach");
  assertSequence(i, @"+afterEach");
  // /example4
  assertSequence(i, @"+beforeEach");
  assertSequence(i, @"/beforeEach");
  assertSequence(i, @"/example4");
  assertSequence(i, @"/afterEach");
  assertSequence(i, @"+afterEach");
  assertSequence(i, @"/afterAll");
}

@end
