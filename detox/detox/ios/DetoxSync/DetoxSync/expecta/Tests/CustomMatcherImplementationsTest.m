//
//  TestCustomMatcherImplementations.m
//  Expecta
//
//  Created by Luke Redpath on 26/03/2012.
//  Copyright (c) 2012 Peter Jihoon Kim. All rights reserved.
//

#import "TestHelper.h"
#import "NSValue+Expecta.h"

@interface MyCustomMatcherImpl : NSObject <EXPMatcher> {
  NSString *_expected;
}

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithExpected:(NSString *)expected NS_DESIGNATED_INITIALIZER;

@end

@implementation MyCustomMatcherImpl

- (instancetype)initWithExpected:(NSString *)expected
{
  if ((self = [super init])) {
    _expected = [expected copy];
  }
  return self;
}

- (BOOL)matches:(id)actual
{
  return [_expected isEqual:actual];
}

@end

EXPMatcherInterface(_equalWithCustomMatcher, (id expected));
#define equalWithCustomMatcher(expected) _equalWithCustomMatcher(EXPObjectify((expected)))

@implementation EXPExpect (MyCustomMatcher)

- (void(^) (id expected))_equalWithCustomMatcher
{
  return [^(id expected) {
    MyCustomMatcherImpl *customMatcher = [[MyCustomMatcherImpl alloc] initWithExpected:expected];
    [self applyMatcher:customMatcher];
    [customMatcher release];
  } copy];
}

@end

@interface CustomMatcherImplementationsTest : XCTestCase
@end

@implementation CustomMatcherImplementationsTest

- (void)test_CanUseCustomImplementationsOf_EXPMatcher
{
  assertPass(test_expect(@"foo").equalWithCustomMatcher(@"foo"));
  assertFail(test_expect(@"foo").equalWithCustomMatcher(@"bar"), @"Match Failed.");
}

@end
