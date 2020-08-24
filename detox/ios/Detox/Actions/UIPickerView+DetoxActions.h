//
//  UIPickerView+DetoxActions.h
//  Detox
//
//  Created by Leo Natan (Wix) on 4/20/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIPickerView (DetoxActions)

- (void)dtx_setComponent:(NSInteger)component toValue:(id)value;

@end

NS_ASSUME_NONNULL_END
