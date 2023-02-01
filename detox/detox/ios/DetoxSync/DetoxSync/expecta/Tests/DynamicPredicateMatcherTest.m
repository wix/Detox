//
//  DynamicPredicateMatcherTest.m
//  Expecta
//
//  Created by Luke Redpath on 26/03/2012.
//  Copyright (c) 2012 Peter Jihoon Kim. All rights reserved.
//

#import "TestHelper.h"

@interface LightSwitch : NSObject {
  BOOL turnedOn;
}
@property (nonatomic, assign, getter=isTurnedOn) BOOL turnedOn;
@end

@implementation LightSwitch
@synthesize turnedOn;
@end

EXPMatcherInterface(isTurnedOn, (void));
EXPMatcherInterface(beTurnedOn, (void));

@interface DynamicPredicateMatcherTest : XCTestCase
@end

@implementation DynamicPredicateMatcherTest

- (void)test_CanUseObjectPredicatesAsBooleanMatchers
{
  LightSwitch *lightSwitch = [[LightSwitch alloc] init];

  lightSwitch.turnedOn = YES;

  expect(lightSwitch).to.beTurnedOn();

  lightSwitch.turnedOn = NO;

  expect(lightSwitch).toNot.beTurnedOn();
}

@end

EXPMatcherAliasImplementation(beTurnedOn, isTurnedOn, (void));
