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
#import <EarlGrey/GREYError.h>
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
- (void)removeCandidateList;

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
		
		
		[UIKeyboardImpl.sharedInstance removeCandidateList];
		
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

static UIView* _isViewOrDescendantFirstResponder(UIView* view)
{
	id currentFirstResponder = view.window.firstResponder;
	
	if([currentFirstResponder isKindOfClass:UIView.class] == NO)
	{
		return nil;
	}
	
	if(currentFirstResponder != nil && [currentFirstResponder isDescendantOfView:view])
	{
		return currentFirstResponder;
	}
	
	return nil;
}

static UIView* _ensureFirstResponderIfNeeded(UIView* view, NSError* __strong * errorOrNil)
{
	UIView* firstResponder = _isViewOrDescendantFirstResponder(view);
	
	if(firstResponder != nil)
	{
		return firstResponder;
	}
	
	// Tap on the element to make expectedFirstResponderView a first responder.
	if ([[GREYActions actionForTap] perform:view error:errorOrNil] == NO)
	{
		return nil;
	}
	
	firstResponder = _isViewOrDescendantFirstResponder(view);
	if(firstResponder == nil && [view becomeFirstResponder])
	{
		firstResponder = view;
	}
	
	if(firstResponder == nil)
	{
		NSString *description = @"Failed to make element [E] first responder.";
		NSDictionary *glossary = @{ @"E" : [view grey_description] };
		GREYPopulateErrorNotedOrLog(errorOrNil,
									kGREYInteractionErrorDomain,
									kGREYInteractionActionFailedErrorCode,
									description,
									glossary);
	}
	
	return firstResponder;
}

static BOOL _assertFirstResponderSupportsTextInput(UIView* firstResponder, UIView* view, __strong NSError** errorOrNil)
{
	if([firstResponder conformsToProtocol:@protocol(UITextInput)])
	{
		return YES;
	}
	
	NSString *description;
	NSDictionary* glossary;
	if(firstResponder == view)
	{
		description = @"Element [E] does not conform to UITextInput protocol.";
		glossary = @{ @"E": [firstResponder grey_description] };
	}
	else
	{
		description = @"Element [F] (descendant of [E]) does not conform to UITextInput protocol.";
		glossary = @{ @"F": [firstResponder grey_description], @"E": [view grey_description] };
	}
	
	GREYPopulateErrorNotedOrLog(errorOrNil,
								kGREYInteractionErrorDomain,
								kGREYInteractionActionFailedErrorCode,
								description,
								glossary);
	return NO;
}

+ (id<GREYAction>)dtx_actionForClearText
{
	return [GREYActionBlock actionWithName:@"Clear text" constraints:grey_not(grey_systemAlertViewShown()) performBlock:^BOOL(UIView* _Nonnull view, NSError * _Nullable __strong * _Nullable errorOrNil) {
		
		UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(view, errorOrNil);
		if(firstResponder == nil)
		{
			return NO;
		}
		
		if(_assertFirstResponderSupportsTextInput(firstResponder, view, errorOrNil) == NO)
		{
			return NO;
		}
		
		UITextPosition* beginningOfDocument = firstResponder.beginningOfDocument;
		UITextPosition* endOfDocument = firstResponder.endOfDocument;
			
		UITextRange* range = [firstResponder textRangeFromPosition:beginningOfDocument toPosition:endOfDocument];
		NSString* textStr = [firstResponder textInRange:range];
		
		NSMutableString* deleteStr = [NSMutableString new];
		for(NSUInteger i = 0; i < textStr.length; i++)
		{
			[deleteStr appendString:@"\b"];
		}
		
		if (deleteStr.length == 0)
		{
			return YES;
		}
		
		[firstResponder setSelectedTextRange:[firstResponder textRangeFromPosition:endOfDocument toPosition:endOfDocument]];
		id<GREYAction> typeAtEnd = [GREYActions dtx_actionForTypeText:deleteStr];
		return [typeAtEnd perform:firstResponder error:errorOrNil];
	}];
}

+ (id<GREYAction>)dtx_actionForTypeText:(NSString *)text
{
	return [GREYActionBlock actionWithName:[NSString stringWithFormat:@"Type '%@'", text]
							   constraints:grey_not(grey_systemAlertViewShown())
							  performBlock:^BOOL (UIView* view, __strong NSError **errorOrNil) {
		UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(view, errorOrNil);
		if(firstResponder == nil)
		{
			return NO;
		}
		
		if(_assertFirstResponderSupportsTextInput(firstResponder, view, errorOrNil) == NO)
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
