//
//  GREYCondition+Detox.m
//  Detox
//
//  Created by Tal Kol on 10/9/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "GREYCondition+Detox.h"

@implementation GREYCondition (Detox)

+ (instancetype)detoxConditionForElementMatched:(GREYElementInteraction*)interaction
{
    return [self conditionWithName:@"Wait for element Detox Condition" block:^BOOL{
        NSError *error;
        [interaction assertWithMatcher:grey_notNil() error:&error];
        return (error == nil);
    }];
}

@end
