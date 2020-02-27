//
//  XCUIElement+UIDatePickerSupport.h
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 9/15/19.
//  Copyright © 2019 LeoNatan. All rights reserved.
//

#import <XCTest/XCTest.h>

NS_ASSUME_NONNULL_BEGIN

@interface XCUIElement (UIDatePickerSupport)

@property (readonly, strong) NSDate* dtx_date;
@property (readonly) NSTimeInterval dtx_countDownDuration;

- (void)dtx_adjustToDatePickerDate:(NSDate *)date;
- (void)dtx_adjustToCountDownDuration:(NSTimeInterval)countDownDuration;

@end

NS_ASSUME_NONNULL_END
