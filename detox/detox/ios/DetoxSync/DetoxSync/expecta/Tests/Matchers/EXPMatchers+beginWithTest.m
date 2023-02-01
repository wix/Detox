#import "TestHelper.h"

@interface EXPMatchers_beginWithTest : XCTestCase
{
  id object;
  NSOrderedSet *emptySet, *sampleSet;
}
@end

@implementation EXPMatchers_beginWithTest

- (void)setUp {
  object = [NSObject new];
  emptySet = [NSOrderedSet orderedSet];
  sampleSet = [NSOrderedSet orderedSetWithObjects:@"Bar", @1, @"baz", nil];
}

- (void)test_beginWith {
  //NSString
  assertPass(test_expect(@"Foobar").beginWith(@"Foo"));
  assertPass(test_expect([@"Foobar" mutableCopy]).beginWith(@"Foo"));
  assertPass(test_expect(@"Foobar").beginWith([@"Foo" mutableCopy]));
  assertPass(test_expect([@"Foobar" mutableCopy]).beginWith([@"Foo" mutableCopy]));
  assertPass(test_expect(@" A B C").beginWith(@" A"));
  
  assertFail(test_expect(@"123").beginWith(@"one"), @"expected: 123 to begin with one");
  assertFail(test_expect(nil).beginWith(@"Foo"), @"the object is nil/null");
  assertFail(test_expect(@"Bar").beginWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(@"Foo").beginWith(object), ([NSString stringWithFormat:@"Foo and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).beginWith(@"Bar"), ([NSString stringWithFormat:@"<NSObject: %p> and Bar are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(@"Foobar").beginWith(@""), @"expected: Foobar to begin with ");
  assertFail(test_expect(@"").beginWith(@""), @"expected:  to begin with ");
  
  //NSArray
  assertPass(test_expect((@[@1, @2])).beginWith(@[@1]));
  assertPass(test_expect(([@[@1, @2] mutableCopy])).beginWith(@[@1]));
  assertPass(test_expect((@[@1, @2])).beginWith([@[@1] mutableCopy]));
  assertPass(test_expect(([@[@1, @2] mutableCopy])).beginWith([@[@1] mutableCopy]));
  
  assertFail(test_expect((@[@1, @2])).beginWith(@[@"one"]), @"expected: (1, 2) to begin with (one)");
  assertFail(test_expect(nil).beginWith(@[@1, @2]), @"the object is nil/null");
  assertFail(test_expect((@[@1, @2])).beginWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(@[@1]).beginWith(object), ([NSString stringWithFormat:@"(1) and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).beginWith(@[@1]), ([NSString stringWithFormat:@"<NSObject: %p> and (1) are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect((@[@1, @2])).beginWith(@[]), @"expected: (1, 2) to begin with ()");
  assertFail(test_expect(@[]).beginWith(@[]), @"expected: () to begin with ()");
  
  //NSOrderedSet
  assertPass(test_expect(sampleSet).beginWith([NSOrderedSet orderedSetWithObjects:@"Bar", @1, nil]));
  assertPass(test_expect([sampleSet mutableCopy]).beginWith([NSOrderedSet orderedSetWithObjects:@"Bar", @1, nil]));
  assertPass(test_expect(sampleSet).beginWith([[NSOrderedSet orderedSetWithObjects:@"Bar", @1, nil] mutableCopy]));
  assertPass(test_expect([sampleSet mutableCopy]).beginWith([[NSOrderedSet orderedSetWithObjects:@"Bar", @1, nil] mutableCopy]));
  
  assertFail(test_expect(sampleSet).beginWith([NSOrderedSet orderedSetWithObjects:@2, @"three", nil]), @"expected: {(Bar, 1, baz)} to begin with {(2, three)}");
  assertFail(test_expect(nil).beginWith(sampleSet), @"the object is nil/null");
  assertFail(test_expect(sampleSet).beginWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(sampleSet).beginWith(object), ([NSString stringWithFormat:@"{(Bar, 1, baz)} and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).beginWith(sampleSet), ([NSString stringWithFormat:@"<NSObject: %p> and {(Bar, 1, baz)} are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(sampleSet).beginWith(emptySet), @"expected: {(Bar, 1, baz)} to begin with {()}");
  assertFail(test_expect(emptySet).beginWith(emptySet), @"expected: {()} to begin with {()}");
}

- (void)test_notTo_beginWith {
  //NSString
  assertPass(test_expect(@"123").notTo.beginWith(@"one"));
  assertPass(test_expect([@"123" mutableCopy]).notTo.beginWith(@"one"));
  assertPass(test_expect(@"123").notTo.beginWith([@"one" mutableCopy]));
  assertPass(test_expect([@"123" mutableCopy]).notTo.beginWith([@"one" mutableCopy]));
  assertPass(test_expect(@"Foobar").notTo.beginWith(@""));
  assertPass(test_expect(@"").notTo.beginWith(@""));
  
  assertFail(test_expect(@"Foobar").notTo.beginWith(@"Foo"), @"expected: Foobar not to begin with Foo");
  assertFail(test_expect(@" A B C").notTo.beginWith(@" A"), @"expected:  A B C not to begin with  A");
  assertFail(test_expect(nil).notTo.beginWith(@"Foo"), @"the object is nil/null");
  assertFail(test_expect(@"Bar").notTo.beginWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(@"Foo").notTo.beginWith(object), ([NSString stringWithFormat:@"Foo and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).notTo.beginWith(@"Bar"), ([NSString stringWithFormat:@"<NSObject: %p> and Bar are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  
  //NSArray
  assertPass(test_expect((@[@1, @2])).notTo.beginWith(@[@"one"]));
  assertPass(test_expect(([@[@1, @2] mutableCopy])).notTo.beginWith(@[@"one"]));
  assertPass(test_expect((@[@1, @2])).notTo.beginWith([@[@"one"] mutableCopy]));
  assertPass(test_expect(([@[@1, @2] mutableCopy])).notTo.beginWith([@[@"one"] mutableCopy]));
  assertPass(test_expect((@[@1, @2])).notTo.beginWith(@[]));
  assertPass(test_expect(@[]).notTo.beginWith(@[]));
  
  assertFail(test_expect((@[@1, @2])).notTo.beginWith(@[@1]), @"expected: (1, 2) not to begin with (1)");
  assertFail(test_expect(nil).notTo.beginWith(@[@1, @2]), @"the object is nil/null");
  assertFail(test_expect((@[@1, @2])).notTo.beginWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(@[@1]).notTo.beginWith(object), ([NSString stringWithFormat:@"(1) and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).notTo.beginWith(@[@1]), ([NSString stringWithFormat:@"<NSObject: %p> and (1) are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  
  //NSOrderedSet
  assertPass(test_expect(sampleSet).notTo.beginWith([NSOrderedSet orderedSetWithObjects:@2, @"three", nil]));
  assertPass(test_expect([sampleSet mutableCopy]).notTo.beginWith([NSOrderedSet orderedSetWithObjects:@2, @"three", nil]));
  assertPass(test_expect(sampleSet).notTo.beginWith([[NSOrderedSet orderedSetWithObjects:@2, @"three", nil] mutableCopy]));
  assertPass(test_expect([sampleSet mutableCopy]).notTo.beginWith([[NSOrderedSet orderedSetWithObjects:@2, @"three", nil] mutableCopy]));
  assertPass(test_expect(sampleSet).notTo.beginWith(emptySet));
  assertPass(test_expect(emptySet).notTo.beginWith(emptySet));
  
  assertFail(test_expect(sampleSet).notTo.beginWith([NSOrderedSet orderedSetWithObjects:@"Bar", @1, nil]), @"expected: {(Bar, 1, baz)} not to begin with {(Bar, 1)}");
  assertFail(test_expect(nil).notTo.beginWith(sampleSet), @"the object is nil/null");
  assertFail(test_expect(sampleSet).notTo.beginWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(sampleSet).notTo.beginWith(object), ([NSString stringWithFormat:@"{(Bar, 1, baz)} and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).notTo.beginWith(sampleSet), ([NSString stringWithFormat:@"<NSObject: %p> and {(Bar, 1, baz)} are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
}

- (void)test_startWith {
  assertPass(test_expect(@"Foobar").startWith(@"Foo"));
}

@end
