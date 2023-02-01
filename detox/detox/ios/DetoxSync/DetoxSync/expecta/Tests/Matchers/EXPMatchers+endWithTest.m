#import "TestHelper.h"

@interface EXPMatchers_endWithTest : XCTestCase
{
  id object;
  NSOrderedSet *emptySet, *sampleSet;
}
@end

@implementation EXPMatchers_endWithTest

- (void)setUp {
  object = [NSObject new];
  emptySet = [NSOrderedSet orderedSet];
  sampleSet = [NSOrderedSet orderedSetWithObjects:@"Bar", @1, @"baz", nil];
}

- (void)test_endWith {
  //NSString
  assertPass(test_expect(@"Foobar").endWith(@"bar"));
  assertPass(test_expect([@"Foobar" mutableCopy]).endWith(@"bar"));
  assertPass(test_expect(@"Foobar").endWith([@"bar" mutableCopy]));
  assertPass(test_expect([@"Foobar" mutableCopy]).endWith([@"bar" mutableCopy]));
  assertPass(test_expect(@" A B C").endWith(@" C"));
  
  assertFail(test_expect(@"123").endWith(@"one"), @"expected: 123 to end with one");
  assertFail(test_expect(nil).endWith(@"Foo"), @"the object is nil/null");
  assertFail(test_expect(@"Bar").endWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(@"Foo").endWith(object), ([NSString stringWithFormat:@"Foo and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).endWith(@"Bar"), ([NSString stringWithFormat:@"<NSObject: %p> and Bar are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(@"Foobar").endWith(@""), @"expected: Foobar to end with ");
  assertFail(test_expect(@"").endWith(@""), @"expected:  to end with ");
  
  //NSArray
  assertPass(test_expect((@[@1, @2])).endWith(@[@2]));
  assertPass(test_expect(([@[@1, @2] mutableCopy])).endWith(@[@2]));
  assertPass(test_expect((@[@1, @2])).endWith([@[@2] mutableCopy]));
  assertPass(test_expect(([@[@1, @2] mutableCopy])).endWith([@[@2] mutableCopy]));
  
  assertFail(test_expect((@[@1, @2])).endWith(@[@"one"]), @"expected: (1, 2) to end with (one)");
  assertFail(test_expect(nil).endWith(@[@1, @2]), @"the object is nil/null");
  assertFail(test_expect((@[@1, @2])).endWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(@[@1]).endWith(object), ([NSString stringWithFormat:@"(1) and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).endWith(@[@1]), ([NSString stringWithFormat:@"<NSObject: %p> and (1) are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect((@[@1, @2])).endWith(@[]), @"expected: (1, 2) to end with ()");
  assertFail(test_expect(@[]).endWith(@[]), @"expected: () to end with ()");
  
  //NSOrderedSet
  assertPass(test_expect(sampleSet).endWith([NSOrderedSet orderedSetWithObjects:@1, @"baz", nil]));
  assertPass(test_expect([sampleSet mutableCopy]).endWith([NSOrderedSet orderedSetWithObjects:@1, @"baz", nil]));
  assertPass(test_expect(sampleSet).endWith([[NSOrderedSet orderedSetWithObjects:@1, @"baz", nil] mutableCopy]));
  assertPass(test_expect([sampleSet mutableCopy]).endWith([[NSOrderedSet orderedSetWithObjects:@1, @"baz", nil] mutableCopy]));
  
  assertFail(test_expect(sampleSet).endWith([NSOrderedSet orderedSetWithObjects:@2, @"three", nil]), @"expected: {(Bar, 1, baz)} to end with {(2, three)}");
  assertFail(test_expect(nil).endWith(sampleSet), @"the object is nil/null");
  assertFail(test_expect(sampleSet).endWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(sampleSet).endWith(object), ([NSString stringWithFormat:@"{(Bar, 1, baz)} and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).endWith(sampleSet), ([NSString stringWithFormat:@"<NSObject: %p> and {(Bar, 1, baz)} are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(sampleSet).endWith(emptySet), @"expected: {(Bar, 1, baz)} to end with {()}");
  assertFail(test_expect(emptySet).endWith(emptySet), @"expected: {()} to end with {()}");
}

- (void)test_notTo_endWith {
  //NSString
  assertPass(test_expect(@"123").notTo.endWith(@"one"));
  assertPass(test_expect([@"123" mutableCopy]).notTo.endWith(@"one"));
  assertPass(test_expect(@"123").notTo.endWith([@"one" mutableCopy]));
  assertPass(test_expect([@"123" mutableCopy]).notTo.endWith([@"one" mutableCopy]));
  assertPass(test_expect(@"Foobar").notTo.endWith(@""));
  assertPass(test_expect(@"").notTo.endWith(@""));
  
  assertFail(test_expect(@"Foobar").notTo.endWith(@"bar"), @"expected: Foobar not to end with bar");
  assertFail(test_expect(@" A B C").notTo.endWith(@" C"), @"expected:  A B C not to end with  C");
  assertFail(test_expect(nil).notTo.endWith(@"Foo"), @"the object is nil/null");
  assertFail(test_expect(@"Bar").notTo.endWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(@"Foo").notTo.endWith(object), ([NSString stringWithFormat:@"Foo and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).notTo.endWith(@"Bar"), ([NSString stringWithFormat:@"<NSObject: %p> and Bar are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  
  //NSArray
  assertPass(test_expect((@[@1, @2])).notTo.endWith(@[@"one"]));
  assertPass(test_expect(([@[@1, @2] mutableCopy])).notTo.endWith(@[@"one"]));
  assertPass(test_expect((@[@1, @2])).notTo.endWith([@[@"one"] mutableCopy]));
  assertPass(test_expect(([@[@1, @2] mutableCopy])).notTo.endWith([@[@"one"] mutableCopy]));
  assertPass(test_expect((@[@1, @2])).notTo.endWith(@[]));
  assertPass(test_expect(@[]).notTo.endWith(@[]));
  
  assertFail(test_expect((@[@1, @2])).notTo.endWith(@[@2]), @"expected: (1, 2) not to end with (2)");
  assertFail(test_expect(nil).notTo.endWith(@[@1, @2]), @"the object is nil/null");
  assertFail(test_expect((@[@1, @2])).notTo.endWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(@[@1]).notTo.endWith(object), ([NSString stringWithFormat:@"(1) and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).notTo.endWith(@[@1]), ([NSString stringWithFormat:@"<NSObject: %p> and (1) are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  
  //NSOrderedSet
  assertPass(test_expect(sampleSet).notTo.endWith([NSOrderedSet orderedSetWithObjects:@2, @"three", nil]));
  assertPass(test_expect([sampleSet mutableCopy]).notTo.endWith([NSOrderedSet orderedSetWithObjects:@2, @"three", nil]));
  assertPass(test_expect(sampleSet).notTo.endWith([[NSOrderedSet orderedSetWithObjects:@2, @"three", nil] mutableCopy]));
  assertPass(test_expect([sampleSet mutableCopy]).notTo.endWith([[NSOrderedSet orderedSetWithObjects:@2, @"three", nil] mutableCopy]));
  assertPass(test_expect(sampleSet).notTo.endWith(emptySet));
  assertPass(test_expect(emptySet).notTo.endWith(emptySet));
  
  assertFail(test_expect(sampleSet).notTo.endWith([NSOrderedSet orderedSetWithObjects:@1, @"baz", nil]), @"expected: {(Bar, 1, baz)} not to end with {(1, baz)}");
  assertFail(test_expect(nil).notTo.endWith(sampleSet), @"the object is nil/null");
  assertFail(test_expect(sampleSet).notTo.endWith(nil), @"the expected value is nil/null");
  assertFail(test_expect(sampleSet).notTo.endWith(object), ([NSString stringWithFormat:@"{(Bar, 1, baz)} and <NSObject: %p> are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
  assertFail(test_expect(object).notTo.endWith(sampleSet), ([NSString stringWithFormat:@"<NSObject: %p> and {(Bar, 1, baz)} are not instances of one of NSString, NSArray, or NSOrderedSet", object]));
}

@end
