//
//  GREYActions+Detox.m
//  Detox
//
//  Created by Matt Findley on 2/7/19.
//  Copyright © 2019 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "GREYActions+Detox.h"
#import <EarlGrey/GREYActions.h>
#import <EarlGrey/NSObject+GREYAdditions.h>
#import <EarlGrey/GREYAppleInternals.h>
@import AudioToolbox;
@import ObjectiveC;

@interface UIKeyboardTaskQueue ()

- (void)performTask:(void (^)(id ctx))arg1;
- (void)waitUntilAllTasksAreFinished;

@end

@interface UIKeyboardImpl ()

+ (instancetype)sharedInstance;
@property(readonly, nonatomic) UIKeyboardTaskQueue *taskQueue;
- (void)handleKeyWithString:(id)arg1 forKeyEvent:(id)arg2 executionContext:(id)arg3;
- (void)setShift:(_Bool)arg1 autoshift:(_Bool)arg2;

@end

static void _DTXTypeText(NSString* text)
{	
	[UIKeyboardImpl.sharedInstance setShift:NO autoshift:NO];
	
	NSUInteger rangeIdx = 0;
	while (rangeIdx < text.length)
	{
		NSRange range = [text rangeOfComposedCharacterSequenceAtIndex:rangeIdx];
		
		NSString* grapheme = [text substringWithRange:range];
		
		[UIKeyboardImpl.sharedInstance.taskQueue performTask:^(id ctx) {
			[UIKeyboardImpl.sharedInstance handleKeyWithString:grapheme forKeyEvent:nil executionContext:ctx];
					
			NSArray* sounds = @[@1104, @1155, @1156];
			
			AudioServicesPlaySystemSound([sounds[grapheme.hash % 3] unsignedIntValue]);
		}];
		[UIKeyboardImpl.sharedInstance.taskQueue waitUntilAllTasksAreFinished];
		
		[NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
		
		rangeIdx += range.length;
	}
}

@interface GREYActions ()

+ (void)grey_setText:(NSString *)text onWebElement:(id)element;

@end

@implementation GREYActions (Detox)

+ (void)load
{
	Method m = class_getClassMethod(self, NSSelectorFromString(@"actionForTypeText:"));
	method_setImplementation(m, imp_implementationWithBlock(^(id _self, NSString* text) {
		return [self dtx_actionForTypeText:text];
	}));
	
	m = class_getClassMethod(self, NSSelectorFromString(@"actionForClearText"));
	method_setImplementation(m, imp_implementationWithBlock(^(id _self, NSString* text) {
		return [self dtx_actionForClearText];
	}));
}

static BOOL _assureFirstResponderIfNeeded(id expectedFirstResponderView, NSError* __strong * errorOrNil)
{
	BOOL isFirstResponder = [expectedFirstResponderView isFirstResponder];
	
	if(isFirstResponder == NO)
	{
		// Tap on the element to make expectedFirstResponderView a first responder.
		if ([[GREYActions actionForTap] perform:expectedFirstResponderView error:errorOrNil] == NO)
		{
			return NO;
		}
		
		return [expectedFirstResponderView becomeFirstResponder];
	}
	
	return YES;
}

+ (id<GREYAction>)dtx_actionForClearText
{
	return [GREYActionBlock actionWithName:@"Clear text" constraints:grey_not(grey_systemAlertViewShown()) performBlock:^BOOL(id  _Nonnull element, NSError * _Nullable __strong * _Nullable errorOrNil) {
		
		BOOL firstResponder = _assureFirstResponderIfNeeded(element, errorOrNil);
		if(firstResponder == NO)
		{
			return NO;
		}
		
		NSString *textStr;
		if ([element grey_isWebAccessibilityElement]) {
			[GREYActions grey_setText:@"" onWebElement:element];
			return YES;
		} else if ([element isKindOfClass:NSClassFromString(@"UIAccessibilityTextFieldElement")]) {
			element = [element textField];
		} else if ([element respondsToSelector:@selector(text)]) {
			textStr = [element text];
		} else {
			UITextRange *range = [element textRangeFromPosition:[element beginningOfDocument]
													 toPosition:[element endOfDocument]];
			textStr = [element textInRange:range];
		}
		
		NSMutableString *deleteStr = [[NSMutableString alloc] init];
		for (NSUInteger i = 0; i < textStr.length; i++) {
			[deleteStr appendString:@"\b"];
		}
		
		if (deleteStr.length == 0) {
			return YES;
		} else if ([element conformsToProtocol:@protocol(UITextInput)]) {
			id<GREYAction> typeAtEnd = [GREYActions dtx_actionForTypeText:deleteStr];
			return [typeAtEnd perform:element error:errorOrNil];
		} else {
			return [[GREYActions dtx_actionForTypeText:deleteStr] perform:element error:errorOrNil];
		}
	}];
}

+ (id<GREYAction>)dtx_actionForTypeText:(NSString *)text
{
	return [GREYActionBlock actionWithName:[NSString stringWithFormat:@"Type '%@'", text]
							   constraints:grey_not(grey_systemAlertViewShown())
							  performBlock:^BOOL (UIView* expectedFirstResponderView, __strong NSError **errorOrNil) {
		BOOL firstResponder = _assureFirstResponderIfNeeded(expectedFirstResponderView, errorOrNil);
		if(firstResponder == NO)
		{
			return NO;
		}
		
		_DTXTypeText(text);
		
		return YES;
	}];
}

+ (id<GREYAction>)detoxSetDatePickerDate:(NSString *)dateString withFormat:(NSString *)dateFormat
{
	NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  	formatter.dateFormat = dateFormat;

	NSDate *date = [formatter dateFromString:dateString];
	return [GREYActions actionForSetDate:date];
}
@end
