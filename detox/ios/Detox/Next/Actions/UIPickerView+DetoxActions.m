//
//  UIPickerView+DetoxActions.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/20/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIPickerView+DetoxActions.h"
#import "UIView+DetoxMatchers.h"

@implementation UIPickerView (DetoxActions)

- (void)dtx_setComponent:(NSInteger)component toValue:(id)value
{
	NSInteger componentCount = [self.dataSource numberOfComponentsInPickerView:self];
	
	NSAssert(componentCount > component, @"Invalid component %@ for picker view %@", @(component), self);

	NSInteger rowCount = [self.dataSource pickerView:self numberOfRowsInComponent:component];

	for(NSInteger idx = 0; idx < rowCount; idx ++)
	{
		NSString* title;
		if([self.delegate respondsToSelector:@selector(pickerView:titleForRow:forComponent:)])
		{
			title = [self.delegate pickerView:self titleForRow:idx forComponent:component];
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
	}
	
	NSAssert(NO, @"Picker view %@ does not contain value %@ for component %@", self, value, @(component));
}

@end
