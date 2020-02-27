//
//  XCUIElement+UIDatePickerSupport.m
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 9/15/19.
//  Copyright © 2019 LeoNatan. All rights reserved.
//

#import "XCUIElement+UIDatePickerSupport.h"
#import "DTXDetoxApplication.h"
#import "DTXTestCaseAssertions.h"
#import "_DTXXCUIElementProxy.h"
@import UIKit;

@interface NSObject ()

- (NSString*)formattedDateString;
- (UILabel*)titleLabel;

@end

@interface LNDatePickerUnarchiver : NSKeyedUnarchiver @end
@implementation LNDatePickerUnarchiver

+ (UIDatePicker*)unarchiveDatePickerWithData:(NSData*)data
{
	NSError* error;
	NSKeyedUnarchiver* unarchiver = [[self alloc] initForReadingFromData:data error:&error];
	unarchiver.requiresSecureCoding = NO;
	unarchiver.delegate = (id)self;
	
	return [unarchiver decodeObjectForKey:NSKeyedArchiveRootObjectKey];
}

+ (nullable Class)unarchiver:(NSKeyedUnarchiver *)unarchiver cannotDecodeObjectOfClassName:(NSString *)name originalClasses:(NSArray<NSString *> *)classNames
{
	return [UIDatePicker class];
}

@end

static UIDatePicker* _datePickerFromValueProvider(XCUIElement* self)
{
	if(self.elementType != XCUIElementTypeDatePicker)
	{
		DTXFail(@"%s can only be called with elements of type XCUIElementTypePickerWheel, not valid for %@.", __FUNCTION__, self);
		return nil;
	}
	
	NSData* data = [[NSData alloc] initWithBase64EncodedString:[(XCUIElement*)self value] options:0];
	return [LNDatePickerUnarchiver unarchiveDatePickerWithData:data];
}

@implementation XCUIElement (UIDatePickerSupport)

- (NSDate *)dtx_date
{
	return _datePickerFromValueProvider(self).date;
}

- (NSTimeInterval)dtx_countDownDuration
{
	return _datePickerFromValueProvider(self).countDownDuration;
}

- (void)dtx_adjustToDatePickerDate:(NSDate *)date
{
	[self _dtx_waitForIdleAndDisable];
	
	UIDatePicker* datePicker = _datePickerFromValueProvider(self);
	
	if(datePicker.datePickerMode == UIDatePickerModeCountDownTimer)
	{
		DTXFail(@"%s cannot be called with count down timer date pickers.", __FUNCTION__);
		return;
	}
	
	[self _dtx_synchronizeComponentPickersWithDatePicker:datePicker selector:@selector(setDate:) value:date];
	
	[self _dtx_enableIdle];
}

- (void)dtx_adjustToCountDownDuration:(NSTimeInterval)countdownDuration
{
	[self _dtx_waitForIdleAndDisable];
	
	UIDatePicker* datePicker = _datePickerFromValueProvider(self);
	
	if(datePicker.datePickerMode != UIDatePickerModeCountDownTimer)
	{
		DTXFail(@"%s can only be called with count down timer date pickers.", __FUNCTION__);
		return;
	}
	
	[self _dtx_synchronizeComponentPickersWithDatePicker:datePicker selector:@selector(setCountDownDuration:) value:@(countdownDuration)];
	
	[self _dtx_enableIdle];
}

- (void)_dtx_synchronizeComponentPickersWithDatePicker:(UIDatePicker*)datePicker selector:(SEL)selector value:(id)value
{
	NSMutableArray* selectedRows = [NSMutableArray new];
	
	UIPickerView<UIPickerViewDelegate>* pickerDelegate = [datePicker valueForKey:@"pickerView"];
	NSUInteger numberOfComponents = [pickerDelegate numberOfComponents];
	for (NSUInteger idx = 0; idx < numberOfComponents; idx++)
	{
		[selectedRows addObject:@([pickerDelegate selectedRowInComponent:idx])];
	}
	
//	DTXDetoxApplication* application = [self valueForKey:@"application"];
//	if([application isKindOfClass:DTXDetoxApplication.class])
//	{
//		[application.detoxHelper beginDelayingTimePickerEvents];
//	}
	
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
	[datePicker performSelector:selector withObject:value];
#pragma clang diagnostic pop
	
	for (NSUInteger idx = 0; idx < numberOfComponents; idx++)
	{
		NSInteger targetIdx = [pickerDelegate selectedRowInComponent:idx];
		NSInteger currentIdx = [selectedRows[idx] integerValue];
		
		while(currentIdx != targetIdx)
		{
			if(currentIdx < targetIdx)
			{
				currentIdx = MIN(currentIdx + 40, targetIdx);
			}
			else
			{
				currentIdx = MAX(currentIdx - 40, targetIdx);
			}
			
			id label = (id)[pickerDelegate pickerView:pickerDelegate viewForRow:currentIdx forComponent:idx reusingView:nil];
			NSString* strValue;
			
			if([label respondsToSelector:@selector(formattedDateString)])
			{
				strValue = [label formattedDateString];
			}
			else
			{
				strValue = [label titleLabel].text;
			}
			
			[[self.pickerWheels elementBoundByIndex:idx] adjustToPickerWheelValue:strValue];
		}
	}
	
//	if([application isKindOfClass:DTXDetoxApplication.class])
//	{
//		[application.detoxHelper endDelayingTimePickerEventsWithCompletionHandler:^{}];
//	}
}

@end
