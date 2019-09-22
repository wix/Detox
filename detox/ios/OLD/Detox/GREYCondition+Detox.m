//
//  GREYCondition+Detox.m
//  Detox
//
//  Created by Tal Kol on 10/9/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "GREYCondition+Detox.h"
#import <EarlGrey/GREYError.h>

GREYError* _dtx_elementMatcherError;

@implementation GREYCondition (Detox)

+ (instancetype)detoxConditionForElementMatched:(GREYElementInteraction*)interaction
{
    return [self conditionWithName:@"Wait for element Detox Condition" block:^BOOL{
		_dtx_elementMatcherError = nil;
        [interaction assertWithMatcher:grey_notNil() error:&_dtx_elementMatcherError];
        return (_dtx_elementMatcherError == nil);
    }];
}

+ (instancetype)detoxConditionForNotElementMatched:(GREYElementInteraction*)interaction
{
    return [self conditionWithName:@"Wait for not element Detox Condition" block:^BOOL{
		_dtx_elementMatcherError = nil;
        [interaction assertWithMatcher:grey_nil() error:&_dtx_elementMatcherError];
        return (_dtx_elementMatcherError == nil);
    }];
}

@end
