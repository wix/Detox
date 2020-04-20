//
//  UIView+Detox.m
//  ExampleApp
//
//  Created by Leo Natan (Wix) on 4/16/20.
//

#import "UIView+DetoxActions.h"

@import Darwin;
@import AudioToolbox;

#import "DTXAppleInternals.h"
#import "DTXSyntheticEvents.h"

@implementation UIView (Detox)

- (CGPoint)_dtx_accessibilityActivationPointInViewCoordinateSpace
{
	return [self.window.screen.coordinateSpace convertPoint:self.accessibilityActivationPoint toCoordinateSpace:self.coordinateSpace];
}

- (void)dtx_tapAtAccessibilityActivationPoint
{
	[self dtx_tapAtPoint:self._dtx_accessibilityActivationPointInViewCoordinateSpace numberOfTaps:1];
}

- (void)dtx_tapAtAccessibilityActivationPointWithNumberOfTaps:(NSUInteger)numberOfTaps
{
	[self dtx_tapAtPoint:self._dtx_accessibilityActivationPointInViewCoordinateSpace numberOfTaps:numberOfTaps];
}

- (void)dtx_tapAtPoint:(CGPoint)point numberOfTaps:(NSUInteger)numberOfTaps
{
	NSParameterAssert(numberOfTaps >= 1);
	point = [self.window convertPoint:point fromView:self];
	for (NSUInteger idx = 0; idx < numberOfTaps; idx++) {
		[DTXSyntheticEvents touchAlongPath:@[@(point)] relativeToWindow:self.window forDuration:0 expendable:NO];
	}
}

- (void)dtx_longPressAtAccessibilityActivationPoint
{
	[self dtx_longPressAtAccessibilityActivationPointForDuration:1.0];
}

- (void)dtx_longPressAtAccessibilityActivationPointForDuration:(NSTimeInterval)duration
{
	[self dtx_longPressAtPoint:self._dtx_accessibilityActivationPointInViewCoordinateSpace duration:duration];
}

- (void)dtx_longPressAtPoint:(CGPoint)point duration:(NSTimeInterval)duration
{
	point = [self.window convertPoint:point fromView:self];
	[DTXSyntheticEvents touchAlongPath:@[@(point)] relativeToWindow:self.window forDuration:duration expendable:NO];
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

static UIView* _ensureFirstResponderIfNeeded(UIView* view)
{
	UIView* firstResponder = _isViewOrDescendantFirstResponder(view);
	
	if(firstResponder != nil)
	{
		return firstResponder;
	}
	
	// Tap on the element to make expectedFirstResponderView a first responder.
	[view dtx_tapAtAccessibilityActivationPoint];
	
	firstResponder = _isViewOrDescendantFirstResponder(view);
	if(firstResponder == nil && [view becomeFirstResponder])
	{
		firstResponder = view;
	}
	
	if(firstResponder == nil)
	{
		NSCAssert(firstResponder == nil, @"Failed to make view %@ first responder", view);
	}
	
	return firstResponder;
}

static BOOL _assertFirstResponderSupportsTextInput(UIView* firstResponder, UIView* view)
{
	if([firstResponder conformsToProtocol:@protocol(UITextInput)])
	{
		return YES;
	}
	
	NSCAssert(NO, @"First responder does not conform to UITextInput protocol");
	
	return NO;
}

__attribute__((constructor))
static void _DTXFixupKeyboard(void)
{
	static char const *const controllerPrefBundlePath = "/System/Library/PrivateFrameworks/TextInput.framework/TextInput";
	__unused void *handle = dlopen(controllerPrefBundlePath, RTLD_LAZY);
	
	TIPreferencesController* controller = TIPreferencesController.sharedPreferencesController;
	if([controller respondsToSelector:@selector(setAutocorrectionEnabled:)] == YES)
	{
		controller.autocorrectionEnabled = NO;
	}
	else
	{
		[controller setValue:@NO forPreferenceKey:@"KeyboardAutocorrection"];
	}
	
	if([controller respondsToSelector:@selector(setPredictionEnabled:)])
	{
		controller.predictionEnabled = NO;
	}
	else
	{
		[controller setValue:@NO forPreferenceKey:@"KeyboardPrediction"];
	}
	
	[controller setValue:@YES forPreferenceKey:@"DidShowGestureKeyboardIntroduction"];
	if(UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone)
	{
		[controller setValue:@YES forPreferenceKey:@"DidShowContinuousPathIntroduction"];
	}

	[controller synchronizePreferences];
}

static void _DTXTypeText(NSString* text)
{
	NSUInteger rangeIdx = 0;
	while (rangeIdx < text.length)
	{
		NSRange range = [text rangeOfComposedCharacterSequenceAtIndex:rangeIdx];
		
		NSString* grapheme = [text substringWithRange:range];
		
		[UIKeyboardImpl.sharedInstance setShift:NO autoshift:NO];
		
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

- (void)dtx_clearText
{
	UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(self);
	
	_assertFirstResponderSupportsTextInput(firstResponder, self);
	
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
		return;
	}
	
	_DTXTypeText(deleteStr);
}

- (void)dtx_typeText:(NSString*)text
{
	UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(self);
	
	_assertFirstResponderSupportsTextInput(firstResponder, self);
	
	_DTXTypeText(text);
}

- (void)dtx_replaceText:(NSString*)text
{
	UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(self);
	
	_assertFirstResponderSupportsTextInput(firstResponder, self);
	
	BOOL isControl = [self isKindOfClass:UIControl.class];
	BOOL isTextField = [self isKindOfClass:UITextField.class];
	BOOL isTextView = [self isKindOfClass:UITextView.class];
	
	if(isControl == YES)
	{
		[(UIControl*)self sendActionsForControlEvents:UIControlEventEditingDidBegin];
	}
	
	if(isTextField == YES)
	{
		[NSNotificationCenter.defaultCenter postNotificationName:UITextFieldTextDidBeginEditingNotification object:self];
	}
	
	if(isTextView == YES)
	{
		[[(UITextView*)self delegate] textViewDidBeginEditing:(id)self];
	}
	
	UITextPosition* beginningOfDocument = firstResponder.beginningOfDocument;
	UITextPosition* endOfDocument = firstResponder.endOfDocument;
		
	UITextRange* range = [firstResponder textRangeFromPosition:beginningOfDocument toPosition:endOfDocument];
	
	[(id<UITextInput>)self replaceRange:range withText:text];
	
	if(isControl == YES)
	{
		[(UIControl*)self sendActionsForControlEvents:UIControlEventEditingChanged];
		[(UIControl*)self sendActionsForControlEvents:UIControlEventEditingDidEnd];
	}
	
	if(isTextField == YES)
	{
		[NSNotificationCenter.defaultCenter postNotificationName:UITextFieldTextDidChangeNotification object:self];
		[NSNotificationCenter.defaultCenter postNotificationName:UITextFieldTextDidEndEditingNotification object:self];
	}
	
	if(isTextView == YES)
	{
		[[(UITextView*)self delegate] textViewDidChange:(id)self];
		[[(UITextView*)self delegate] textViewDidEndEditing:(id)self];
	}
}

@end
