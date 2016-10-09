//
//  GREYCondition+Detox.h
//  Detox
//
//  Created by Tal Kol on 10/9/16.
//  Copyright © 2016 Wix. All rights reserved.
//

@import EarlGrey;

@interface GREYCondition (Detox)

+ (instancetype)detoxConditionForElementMatched:(GREYElementInteraction*)interaction;

@end
