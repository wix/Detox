//
//  UIDatePicker+TestSupport.h
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 10/7/19.
//

#import <UIKit/UIKit.h>

@interface UIDatePicker (TestSupport)

+ (void)dtx_beginDelayingTimePickerEvents;
+ (void)dtx_endDelayingTimePickerEventsWithCompletionHandler:(dispatch_block_t)completionHandler;

@end
