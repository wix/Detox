//
//  UIDatePicker+DetoxActions.h
//  Detox
//
//  Created by Leo Natan (Wix) on 4/20/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIDatePicker (DetoxActions)

- (void)dtx_adjustToDate:(NSDate*)date;

@end

NS_ASSUME_NONNULL_END
