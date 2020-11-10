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
#import "UIView+DetoxUtils.h"

DTX_DIRECT_MEMBERS
@implementation UIView (Detox)

- (void)dtx_tapAtAccessibilityActivationPoint
{
	[self dtx_tapAtPoint:self.dtx_accessibilityActivationPointInViewCoordinateSpace numberOfTaps:1];
}

- (void)dtx_tapAtAccessibilityActivationPointWithNumberOfTaps:(NSUInteger)numberOfTaps
{
	[self dtx_tapAtPoint:self.dtx_accessibilityActivationPointInViewCoordinateSpace numberOfTaps:numberOfTaps];
}

- (void)dtx_tapAtPoint:(CGPoint)point numberOfTaps:(NSUInteger)numberOfTaps
{
	if([self isKindOfClass:UISwitch.class] && numberOfTaps == 1)
	{
		//Attempt a long press on the switch, rather than tap.
		[self dtx_longPressAtPoint:point duration:0.7];
		return;
	}
	
	[self dtx_assertHittableAtPoint:point];
	
	NSParameterAssert(numberOfTaps >= 1);
	point = [self.window convertPoint:point fromView:self];
	for (NSUInteger idx = 0; idx < numberOfTaps; idx++) {
		[DTXSyntheticEvents touchAlongPath:@[@(point)] relativeToWindow:self.window holdDurationOnLastTouch:0.0];
	}
}

- (void)dtx_longPressAtAccessibilityActivationPoint
{
	[self dtx_longPressAtAccessibilityActivationPointForDuration:1.0];
}

- (void)dtx_longPressAtAccessibilityActivationPointForDuration:(NSTimeInterval)duration
{
	[self dtx_longPressAtPoint:self.dtx_accessibilityActivationPointInViewCoordinateSpace duration:duration];
}

- (void)dtx_longPressAtPoint:(CGPoint)point duration:(NSTimeInterval)duration
{
	[self dtx_assertHittableAtPoint:point];
	
	point = [self.window convertPoint:point fromView:self];
	[DTXSyntheticEvents touchAlongPath:@[@(point)] relativeToWindow:self.window holdDurationOnLastTouch:duration];
}

static void _DTXApplySwipe(UIWindow* window, CGPoint startPoint, CGPoint endPoint, CGFloat velocity)
{
	NSCAssert(CGPointEqualToPoint(startPoint, endPoint) == NO, @"Start and end points for swipe cannot be equal");

	NSMutableArray<NSValue*>* points = [NSMutableArray new];
	
	for (CGFloat p = 0.0; p <= 1.0; p += 1.0 / (20.0 * velocity))
	{
		CGFloat x = LNLinearInterpolate(startPoint.x, endPoint.x, p);
		CGFloat y = LNLinearInterpolate(startPoint.y, endPoint.y, p);
		
		[points addObject:@(CGPointMake(x, y))];
	}

	[DTXSyntheticEvents touchAlongPath:points relativeToWindow:window holdDurationOnLastTouch:0.0];
}

#define DTX_CALC_SWIPE_START_END_POINTS(safeBoundsInScreenSpace, screenBounds, normalizedOffset, main, other, CGRectGetMinMain, CGRectGetMidMain, CGRectGetMidOther, CGRectGetMaxMain, CGRectGetMainSize) \
CGFloat mainStart = MAX(MIN(CGRectGetMidMain(screenBounds) - 0.5 * normalizedOffset.main * CGRectGetMainSize(screenBounds), CGRectGetMaxMain(safeBoundsInScreenSpace) - 1), CGRectGetMinMain(safeBoundsInScreenSpace) + 1); \
startPoint.main = mainStart; \
startPoint.other = CGRectGetMidOther(safeBoundsInScreenSpace); \
endPoint.main = MIN(MAX(mainStart + normalizedOffset.main * CGRectGetMainSize(screenBounds), CGRectGetMinMain(screenBounds) + 1), CGRectGetMaxMain(screenBounds) - 1); \
endPoint.other = CGRectGetMidOther(safeBoundsInScreenSpace);

- (void)dtx_swipeWithNormalizedOffset:(CGPoint)normalizedOffset velocity:(CGFloat)velocity
{
	NSParameterAssert(velocity > 0.0);
	
	if(normalizedOffset.x == 0 && normalizedOffset.y == 0)
	{
		return;
	}
	
	CGPoint startPoint;
	CGPoint endPoint;
	
	CGRect safeBounds = self.dtx_safeAreaBounds;
	CGRect safeBoundsInScreenSpace = [self.window.screen.coordinateSpace convertRect:safeBounds fromCoordinateSpace:self.coordinateSpace];
	CGRect screenBounds = self.window.screen.bounds;
	
	if(normalizedOffset.x != 0)
	{
		DTX_CALC_SWIPE_START_END_POINTS(safeBoundsInScreenSpace, screenBounds, normalizedOffset, x, y, CGRectGetMinX, CGRectGetMidX, CGRectGetMidY, CGRectGetMaxX, CGRectGetWidth);
	}
	else
	{
		DTX_CALC_SWIPE_START_END_POINTS(safeBoundsInScreenSpace, screenBounds, normalizedOffset, y, x, CGRectGetMinY, CGRectGetMidY, CGRectGetMidX, CGRectGetMaxY, CGRectGetHeight);
	}
	
	
	[self dtx_assertHittableAtPoint:[self.coordinateSpace convertPoint:startPoint fromCoordinateSpace:self.window.screen.coordinateSpace]];
	
	startPoint = [self.window.coordinateSpace convertPoint:startPoint fromCoordinateSpace:self.window.screen.coordinateSpace];
	endPoint = [self.window.coordinateSpace convertPoint:endPoint fromCoordinateSpace:self.window.screen.coordinateSpace];
	
	_DTXApplySwipe(self.window, startPoint, endPoint, 1.0 / velocity);
}

static void _DTXApplyPinch(UIWindow* window, CGPoint startPoint1, CGPoint endPoint1, CGPoint startPoint2, CGPoint endPoint2, CGFloat velocity)
{
	NSMutableArray<NSValue*>* points1 = [NSMutableArray new];
	NSMutableArray<NSValue*>* points2 = [NSMutableArray new];
	
	for (CGFloat p = 0.0; p <= 1.0; p += 1.0 / (30.0 * velocity))
	{
		CGFloat x = LNLinearInterpolate(startPoint1.x, endPoint1.x, p);
		CGFloat y = LNLinearInterpolate(startPoint1.y, endPoint1.y, p);
		
		[points1 addObject:@(CGPointMake(x, y))];
		
		x = LNLinearInterpolate(startPoint2.x, endPoint2.x, p);
		y = LNLinearInterpolate(startPoint2.y, endPoint2.y, p);
		
		[points2 addObject:@(CGPointMake(x, y))];
	}

	[DTXSyntheticEvents touchAlongMultiplePaths:@[points1, points2] relativeToWindow:window holdDurationOnLastTouch:0.0];
}

static void DTXCalcPinchStartEndPoints(CGRect bounds, CGFloat pixelsScale, CGFloat angle, CGPoint* startPoint1, CGPoint* endPoint1, CGPoint* startPoint2, CGPoint* endPoint2)
{
	*startPoint1 = CGPointMake(CGRectGetMidX(bounds), CGRectGetMidY(bounds));
	*startPoint2 = CGPointMake(CGRectGetMidX(bounds), CGRectGetMidY(bounds));
	
	CGFloat x = CGRectGetMinX(bounds);
	CGFloat y = CGRectGetMinY(bounds);
	CGFloat w = CGRectGetWidth(bounds);
	CGFloat h = CGRectGetHeight(bounds);
	CGFloat alpha = atan((0.5 * h) / (0.5 * w));
	if(angle <= alpha)
	{
		*endPoint1 = CGPointMake(x + w, CGRectGetMidY(bounds) - 0.5 * w * tan(angle));
		*endPoint2 = CGPointMake(x, CGRectGetMidY(bounds) + 0.5 * w * tan(angle));
	}
	else if(angle <= M_PI - alpha)
	{
		*endPoint1 = CGPointMake(CGRectGetMidX(bounds) + 0.5 * h * tan(M_PI_2 - angle), y);
		*endPoint2 = CGPointMake(CGRectGetMidX(bounds) - 0.5 * h * tan(M_PI_2 - angle), y + h);
	}
	else
	{
		*endPoint1 = CGPointMake(x, CGRectGetMidY(bounds) - 0.5 * w * tan(M_PI - angle));
		*endPoint2 = CGPointMake(x + w, CGRectGetMidY(bounds) + 0.5 * w * tan(M_PI - angle));
	}
	
	endPoint1->x = LNLinearInterpolate(startPoint1->x, endPoint1->x, pixelsScale);
	endPoint1->y = LNLinearInterpolate(startPoint1->y, endPoint1->y, pixelsScale);
	endPoint2->x = LNLinearInterpolate(startPoint2->x, endPoint2->x, pixelsScale);
	endPoint2->y = LNLinearInterpolate(startPoint2->y, endPoint2->y, pixelsScale);
}

DTX_ALWAYS_INLINE
static CGFloat clamp(CGFloat v, CGFloat min, CGFloat max)
{
	return MIN(MAX(v, min), max);
}

- (void)dtx_pinchWithScale:(CGFloat)scale velocity:(CGFloat)velocity angle:(CGFloat)angle
{
	NSParameterAssert(velocity > 0.0);
	NSParameterAssert(scale > 0.0);
	
	if(scale == 1.0)
	{
		return;
	}
	
	CGRect safeBounds = self.dtx_safeAreaBounds;
	
	CGPoint startPoint1;
	CGPoint endPoint1;
	CGPoint startPoint2;
	CGPoint endPoint2;
	
	scale = clamp(scale, 0.5005, 1.9995);
	//There is point symmetry in a rectangle and two fingers—normalize angle to [0, pi).
	//Negative angles wrap around 180 degrees (pi).
	angle = fmod(angle, M_PI);
	if(angle < 0)
	{
		angle += M_PI;
	}
	
	if(scale < 1.0)
	{
		DTXCalcPinchStartEndPoints(safeBounds, 1.0 - scale, angle, &endPoint1, &startPoint1, &endPoint2, &startPoint2);
	}
	else
	{
		DTXCalcPinchStartEndPoints(safeBounds, scale - 1.0, angle, &startPoint1, &endPoint1, &startPoint2, &endPoint2);
	}
	
	[self dtx_assertHittableAtPoint:startPoint1];
	[self dtx_assertHittableAtPoint:startPoint2];
	
	startPoint1 = [self.window convertPoint:startPoint1 fromView:self];
	endPoint1 = [self.window convertPoint:endPoint1 fromView:self];
	startPoint2 = [self.window convertPoint:startPoint2 fromView:self];
	endPoint2 = [self.window convertPoint:endPoint2 fromView:self];
	
	_DTXApplyPinch(self.window, startPoint1, endPoint1, startPoint2, endPoint2, 1.0 / velocity);
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
	if(view.window.isKeyWindow == NO)
	{
		[view.window makeKeyWindow];
	}
	
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
		DTXCViewAssert(firstResponder == nil, firstResponder.dtx_viewDebugAttributes, @"Failed to make view “%@” first responder", view.dtx_shortDescription);
	}
	
	return firstResponder;
}

static BOOL _assertFirstResponderSupportsTextInput(UIView* firstResponder)
{
	if([firstResponder conformsToProtocol:@protocol(UITextInput)])
	{
		return YES;
	}
	
	DTXCViewAssert(NO, firstResponder.dtx_viewDebugAttributes, @"First responder “%@” does not conform to “UITextInput” protocol", firstResponder);
	
	return NO;
}

static void _ensureSelectionAtRange(id<UITextInput> textInput, UITextRange* textRange)
{
	if(textRange == nil)
	{
		//If none provided, move selection to end of document.
		textRange = [textInput textRangeFromPosition:textInput.endOfDocument toPosition:textInput.endOfDocument];
	}
	
	textInput.selectedTextRange = textRange;
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
	_assertFirstResponderSupportsTextInput(firstResponder);
	
	UITextPosition* beginningOfDocument = firstResponder.beginningOfDocument;
	UITextPosition* endOfDocument = firstResponder.endOfDocument;
		
	UITextRange* range = [firstResponder textRangeFromPosition:beginningOfDocument toPosition:endOfDocument];
	if(range.isEmpty == YES)
	{
		return;
	}
	
	//Select entire text range
	firstResponder.selectedTextRange = range;
	[NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.3]];
	//Delete it
	_DTXTypeText(@"\b");
}

- (void)dtx_typeText:(NSString*)text
{
	[self dtx_typeText:text atTextRange:nil];
}

- (void)dtx_typeText:(NSString*)text atTextRange:(UITextRange*)textRange
{
	UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(self);
	_assertFirstResponderSupportsTextInput(firstResponder);
	_ensureSelectionAtRange(firstResponder, textRange);
	
	_DTXTypeText(text);
}

- (void)dtx_replaceText:(NSString*)text
{
	UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(self);
	_assertFirstResponderSupportsTextInput(firstResponder);
	
	BOOL isControl = [firstResponder isKindOfClass:UIControl.class];
	BOOL isTextField = [firstResponder isKindOfClass:UITextField.class];
	BOOL isTextView = [firstResponder isKindOfClass:UITextView.class];
	UITextView* textView = (UITextView*)firstResponder;
	
	if(isControl == YES)
	{
		[(UIControl*)firstResponder sendActionsForControlEvents:UIControlEventEditingDidBegin];
	}
	
	if(isTextField == YES)
	{
		[NSNotificationCenter.defaultCenter postNotificationName:UITextFieldTextDidBeginEditingNotification object:firstResponder];
	}
	
	if(isTextView == YES)
	{
		if([textView.delegate respondsToSelector:@selector(textViewDidBeginEditing:)])
		{
			[textView.delegate textViewDidBeginEditing:textView];
		}
	}
	
	UITextPosition* beginningOfDocument = firstResponder.beginningOfDocument;
	UITextPosition* endOfDocument = firstResponder.endOfDocument;
		
	UITextRange* range = [firstResponder textRangeFromPosition:beginningOfDocument toPosition:endOfDocument];
	
	[firstResponder replaceRange:range withText:text];
	
	if(isControl == YES)
	{
		[(UIControl*)firstResponder sendActionsForControlEvents:UIControlEventEditingChanged];
		[(UIControl*)firstResponder sendActionsForControlEvents:UIControlEventEditingDidEnd];
	}
	
	if(isTextField == YES)
	{
		[NSNotificationCenter.defaultCenter postNotificationName:UITextFieldTextDidChangeNotification object:firstResponder];
		[NSNotificationCenter.defaultCenter postNotificationName:UITextFieldTextDidEndEditingNotification object:firstResponder];
	}
	
	if(isTextView == YES)
	{
		if([textView.delegate respondsToSelector:@selector(textViewDidChange:)])
		{
			[textView.delegate textViewDidChange:textView];
		}
		if([textView.delegate respondsToSelector:@selector(textViewDidEndEditing:)])
		{
			[textView.delegate textViewDidEndEditing:textView];
		}
	}
}

@end

