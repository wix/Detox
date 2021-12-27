//
//  UIPickerView+DetoxActions.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/20/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIPickerView+DetoxActions.h"
#import "UIView+DetoxMatchers.h"
#import "UIView+DetoxUtils.h"

@implementation UIPickerView (DetoxActions)

- (void)dtx_setComponent:(NSInteger)component toValue:(id)value
{
	[self dtx_assertVisible];
	
	DTXViewAssert(self.dataSource != nil && self.delegate != nil, self.dtx_elementDebugAttributes, @"The picker view's data source and/or delegate are nil");
	
	NSInteger componentCount = [self.dataSource numberOfComponentsInPickerView:self];
	
	DTXViewAssert(componentCount > component, self.dtx_elementDebugAttributes, @"Invalid component “%@” for picker view “%@”", @(component), self.dtx_shortDescription);

	NSInteger rowCount = [self.dataSource pickerView:self numberOfRowsInComponent:component];

	for(NSInteger idx = 0; idx < rowCount; idx ++)
	{
		NSString* title;
		if([self.delegate respondsToSelector:@selector(pickerView:titleForRow:forComponent:)])
		{
			title = [self.delegate pickerView:self titleForRow:idx forComponent:component];
		}
		else if([self.delegate respondsToSelector:@selector(pickerView:attributedTitleForRow:forComponent:)])
		{
			title = [self.delegate pickerView:self attributedTitleForRow:idx forComponent:component].string;
		}
		else if ([self.delegate respondsToSelector:@selector(pickerView:viewForRow:forComponent:reusingView:)])
		{
			UIView* view = [self.delegate pickerView:self viewForRow:idx forComponent:component reusingView:nil];
			if([view isKindOfClass:UILabel.class])
			{
				title = [(UILabel*)view text];
			}
			else
			{
				UILabel* label = (id)[UIView dtx_findViewsInHierarchy:view passingPredicate:[NSPredicate predicateWithBlock:^BOOL(id  _Nullable evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
					return [evaluatedObject isKindOfClass:UILabel.class];
				}]].firstObject;
				title = label.text;
			}
		}
		
		if([title isEqualToString:value])
		{
			[self selectRow:idx inComponent:component animated:YES];
			if([self.delegate respondsToSelector:@selector(pickerView:didSelectRow:inComponent:)])
			{
				[self.delegate pickerView:self didSelectRow:idx inComponent:component];
			}
			
			//TODO: Is Waiting needed?
			dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
				//Noop
			});
			
			return;
		}
	}
	
	DTXViewAssert(NO, self.dtx_elementDebugAttributes, @"Picker view “%@” does not contain value “%@” for component “%@”", self.dtx_shortDescription, value, @(component));
}

@end
