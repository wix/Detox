//
//  NSObject+DetoxActions.m
//  Detox
//
//  Created by Leo Natan on 11/16/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "NSObject+DetoxActions.h"
#import "NSObject+DetoxUtils.h"
#import "UIApplication+DTXAdditions.h"

@import Darwin;
@import AudioToolbox;

#import "DTXAppleInternals.h"
#import "DTXSyntheticEvents.h"
#import "NSURL+DetoxUtils.h"
#import "UIView+DetoxUtils.h"
#import "UIImage+DetoxUtils.h"

@implementation NSObject (DetoxActions)

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
	
	NSParameterAssert(numberOfTaps >= 1);
	
	UIView* view = self.dtx_view;
	UIWindow* window = view.window;
	CGPoint viewPoint = [self dtx_convertRelativePointToViewCoordinateSpace:point];
	
	[view dtx_assertHittableAtPoint:viewPoint];
	
	CGPoint windowPoint = [window convertPoint:viewPoint fromView:view];
	
	for (NSUInteger idx = 0; idx < numberOfTaps; idx++) {
		[DTXSyntheticEvents touchAlongPath:@[@(windowPoint)] relativeToWindow:window holdDurationOnFirstTouch:0.0 holdDurationOnLastTouch:0.0];
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
	UIView* view = self.dtx_view;
	UIWindow* window = view.window;
	CGPoint viewPoint = [self dtx_convertRelativePointToViewCoordinateSpace:point];
	
	[view dtx_assertHittableAtPoint:viewPoint];

	CGPoint windowPoint = [window convertPoint:viewPoint fromView:view];
	[DTXSyntheticEvents touchAlongPath:@[@(windowPoint)] relativeToWindow:window holdDurationOnFirstTouch:0.0 holdDurationOnLastTouch:duration];
}

#define DTX_ENFORCE_NORMALIZED_STARTING_POINT(normalizedStartingPoint) \
if((isnan(normalizedStartingPoint.x) == NO && (normalizedStartingPoint.x < 0 || normalizedStartingPoint.x > 1)) || isnan(normalizedStartingPoint.y) == NO && (normalizedStartingPoint.y < 0 || normalizedStartingPoint.y > 1)) \
{ \
DTXAssert(NO, @"Bad normalized starting point provided."); \
}

- (void)dtx_longPressAtPoint:(CGPoint)normalizedPoint duration:(NSTimeInterval)duration thenDragToElement:(NSObject*)target normalizedTargetPoint:(CGPoint)normalizedTargetPoint velocity:(CGFloat)velocity thenHoldForDuration:(NSTimeInterval)lastHoldDuration
{
	NSParameterAssert(velocity > 0.0);
	DTX_ENFORCE_NORMALIZED_STARTING_POINT(normalizedPoint);
	DTX_ENFORCE_NORMALIZED_STARTING_POINT(normalizedTargetPoint);
	
	CGPoint calcNormalizedPoint = DTXCalcNormalizedPoint(normalizedPoint, self);
	CGPoint calcNormalizedTargetPoint = DTXCalcNormalizedPoint(normalizedTargetPoint, target);
	
	[self.dtx_view dtx_assertHittableAtPoint:[self.dtx_view.coordinateSpace convertPoint:calcNormalizedPoint fromCoordinateSpace:self.dtx_view.window.screen.coordinateSpace]];
	[target.dtx_view dtx_assertHittableAtPoint:[target.dtx_view.coordinateSpace convertPoint:calcNormalizedTargetPoint fromCoordinateSpace:target.dtx_view.window.screen.coordinateSpace]];
	
	// Converting end point to the window coordinate space of the view we are going to drag
	// Setting the startPoint for better code readbility
	CGPoint startPoint = calcNormalizedPoint;
	CGPoint endPoint = [self.dtx_view.window.coordinateSpace convertPoint:calcNormalizedTargetPoint fromCoordinateSpace:target.dtx_view.window.coordinateSpace];
	
	NSMutableArray<NSValue*>* points = [NSMutableArray new];
	
	// Add start point
	[points addObject:@(startPoint)];
	
	velocity = (UIApplication.dtx_panVelocity * velocity);
	// Find number of points appropriate for the speed
	CGFloat xDiff = endPoint.x - startPoint.x;
	CGFloat yDiff = endPoint.y - startPoint.y;
	NSInteger numOfPoints = lround(fmax(fabs(xDiff) / velocity, fabs(yDiff) / velocity));
	
	// Generate points in between
	CGFloat xDiffDelta = xDiff / numOfPoints;
	CGFloat yDiffDelta = yDiff / numOfPoints;
	for (NSUInteger idx = 1; idx < numOfPoints; idx++) {
		CGPoint point = CGPointMake(startPoint.x + idx * xDiffDelta, startPoint.y + idx * yDiffDelta);
		[points addObject:@(point)];
	}
	
	// Add end point
	[points addObject:@(endPoint)];
	
	[DTXSyntheticEvents touchAlongPath:points relativeToWindow:self.dtx_view.window holdDurationOnFirstTouch:duration holdDurationOnLastTouch:lastHoldDuration];
}

static CGPoint DTXCalcNormalizedPoint(CGPoint normalizedPoint, NSObject* element)
{
	UIWindow* window = element.dtx_view.window;
	UIView* view = element.dtx_view;
	
	CGRect safeBounds = element.dtx_safeAreaBounds;
	CGRect safeBoundsInScreenSpace = [window.screen.coordinateSpace convertRect:safeBounds fromCoordinateSpace:view.coordinateSpace];
	
	CGPoint activationPoint = element.dtx_accessibilityActivationPointInViewCoordinateSpace;
	CGPoint windowConvertedActivationPoint = [window.coordinateSpace convertPoint:activationPoint fromCoordinateSpace:view.coordinateSpace];
	
	CGFloat calcX = !isnan(normalizedPoint.x) ? CGRectGetMinX(safeBoundsInScreenSpace) + CGRectGetWidth(safeBoundsInScreenSpace) * normalizedPoint.x : windowConvertedActivationPoint.x;
	
	CGFloat calcY = !isnan(normalizedPoint.y) ? CGRectGetMinY(safeBoundsInScreenSpace) + CGRectGetHeight(safeBoundsInScreenSpace) * normalizedPoint.y : windowConvertedActivationPoint.y;
	
	return CGPointMake(calcX, calcY);
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
	
	[DTXSyntheticEvents touchAlongPath:points relativeToWindow:window holdDurationOnFirstTouch:0.0 holdDurationOnLastTouch:0.0];
}

- (void)dtx_swipeWithNormalizedOffset:(CGPoint)normalizedOffset velocity:(CGFloat)velocity
{
	[self dtx_swipeWithNormalizedOffset:normalizedOffset velocity:velocity normalizedStartingPoint:CGPointMake(NAN, NAN)];
}

#define DTX_CALC_SWIPE_START_END_POINTS(safeBoundsInScreenSpace, screenBounds, normalizedStartingPoint, normalizedOffset, main, other, CGRectGetMinMain, CGRectGetMinOther, CGRectGetMidMain, CGRectGetMidOther, CGRectGetMaxMain, CGRectGetMainSize, CGRectGetOtherSize) \
CGFloat mainStart = !isnan(normalizedStartingPoint.main) ? CGRectGetMinMain(safeBoundsInScreenSpace) + CGRectGetMainSize(safeBoundsInScreenSpace) * normalizedStartingPoint.main : MAX(MIN(CGRectGetMidMain(screenBounds) - 0.5 * normalizedOffset.main * CGRectGetMainSize(screenBounds), CGRectGetMaxMain(safeBoundsInScreenSpace) - 1), CGRectGetMinMain(safeBoundsInScreenSpace) + 1); \
startPoint.main = mainStart; \
startPoint.other = !isnan(normalizedStartingPoint.other) ? CGRectGetMinOther(safeBoundsInScreenSpace) + CGRectGetOtherSize(safeBoundsInScreenSpace) * normalizedStartingPoint.other : CGRectGetMidOther(safeBoundsInScreenSpace); \
endPoint.main = MIN(MAX(mainStart + normalizedOffset.main * CGRectGetMainSize(screenBounds), CGRectGetMinMain(screenBounds) + 1), CGRectGetMaxMain(screenBounds) - 1); \
endPoint.other = !isnan(normalizedStartingPoint.other) ? CGRectGetMinOther(safeBoundsInScreenSpace) + CGRectGetOtherSize(safeBoundsInScreenSpace) * normalizedStartingPoint.other : CGRectGetMidOther(safeBoundsInScreenSpace);

- (void)dtx_swipeWithNormalizedOffset:(CGPoint)normalizedOffset velocity:(CGFloat)velocity normalizedStartingPoint:(CGPoint)normalizedStartingPoint
{
	NSParameterAssert(velocity > 0.0);
	DTX_ENFORCE_NORMALIZED_STARTING_POINT(normalizedStartingPoint);
	
	if(normalizedOffset.x == 0 && normalizedOffset.y == 0)
	{
		return;
	}
	
	CGPoint startPoint;
	CGPoint endPoint;
	
	UIWindow* window = self.dtx_view.window;
	UIView* view = self.dtx_view;
	
	CGRect safeBounds = self.dtx_safeAreaBounds;
	CGRect safeBoundsInScreenSpace = [window.screen.coordinateSpace convertRect:safeBounds fromCoordinateSpace:view.coordinateSpace];
	CGRect screenBounds = window.screen.bounds;
	
	if(normalizedOffset.x != 0)
	{
		DTX_CALC_SWIPE_START_END_POINTS(safeBoundsInScreenSpace, screenBounds, normalizedStartingPoint, normalizedOffset, x, y, CGRectGetMinX, CGRectGetMinY, CGRectGetMidX, CGRectGetMidY, CGRectGetMaxX, CGRectGetWidth, CGRectGetHeight);
	}
	else
	{
		DTX_CALC_SWIPE_START_END_POINTS(safeBoundsInScreenSpace, screenBounds, normalizedStartingPoint, normalizedOffset, y, x, CGRectGetMinY, CGRectGetMinX, CGRectGetMidY, CGRectGetMidX, CGRectGetMaxY, CGRectGetHeight, CGRectGetWidth);
	}
	
	
	[view dtx_assertHittableAtPoint:[view.coordinateSpace convertPoint:startPoint fromCoordinateSpace:window.screen.coordinateSpace]];
	
	startPoint = [window.coordinateSpace convertPoint:startPoint fromCoordinateSpace:window.screen.coordinateSpace];
	endPoint = [window.coordinateSpace convertPoint:endPoint fromCoordinateSpace:window.screen.coordinateSpace];
	
	_DTXApplySwipe(window, startPoint, endPoint, 1.0 / velocity);
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
	
	[DTXSyntheticEvents touchAlongMultiplePaths:@[points1, points2] relativeToWindow:window holdDurationOnFirstTouch:0.0 holdDurationOnLastTouch:0.0];
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
	
	UIView* view = self.dtx_view;
	UIWindow* window = view.window;
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
	
	startPoint1 = [window convertPoint:startPoint1 fromView:view];
	endPoint1 = [window convertPoint:endPoint1 fromView:view];
	startPoint2 = [window convertPoint:startPoint2 fromView:view];
	endPoint2 = [window convertPoint:endPoint2 fromView:view];
	
	_DTXApplyPinch(window, startPoint1, endPoint1, startPoint2, endPoint2, 1.0 / velocity);
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
		DTXCViewAssert(firstResponder == nil, firstResponder.dtx_elementDebugAttributes, @"Failed to make view “%@” first responder", view.dtx_shortDescription);
	}
	
	return firstResponder;
}

static BOOL _assertFirstResponderSupportsTextInput(UIView* firstResponder)
{
	if([firstResponder conformsToProtocol:@protocol(UITextInput)])
	{
		return YES;
	}
	
	DTXCViewAssert(NO, firstResponder.dtx_elementDebugAttributes, @"First responder “%@” does not conform to “UITextInput” protocol", firstResponder);
	
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
		
		[NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.05]];
		
		
		[UIKeyboardImpl.sharedInstance removeCandidateList];
		
		rangeIdx += range.length;
	}
}

- (void)dtx_clearText
{
	UIView* view = self.dtx_view;
	UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(view);
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
	[NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.05]];
	//Delete it
	_DTXTypeText(@"\b");
}

- (void)dtx_typeText:(NSString*)text
{
	[self dtx_typeText:text atTextRange:nil];
}

- (void)dtx_typeText:(NSString*)text atTextRange:(UITextRange*)textRange
{
	UIView* view = self.dtx_view;
	UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(view);
	_assertFirstResponderSupportsTextInput(firstResponder);
	_ensureSelectionAtRange(firstResponder, textRange);
	
	_DTXTypeText(text);
}

- (void)dtx_replaceText:(NSString*)text
{
	UIView* view = self.dtx_view;
	UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(view);
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

- (NSURL *)dtx_takeScreenshot:(nullable NSString*)name
{
	UIImage *image = [self.dtx_view dtx_imageFromView];
	NSURL *path = [NSURL elementsScreenshotPath];
	NSString *fileName = [NSString stringWithFormat:@"ImageScreenshot_%@.png", name != nil ? name : self];
	[image dtx_saveToPath:path fileName:fileName];
	
	return [path URLByAppendingPathComponent:fileName isDirectory:false];;
}

@end
