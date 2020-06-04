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
#import "UISlider+DetoxUtils.h"

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

__attribute__((always_inline))
static inline void _DTXApplySwipe(UIWindow* window, CGPoint startPoint, CGPoint endPoint, CGFloat velocity)
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

#define DTX_CALC_SWIPE_START_END_POINTS(bounds, mainMidFunc, otherMidFunc, main, other, mainSizeFunc) \
startPoint.other = otherMidFunc(bounds); \
endPoint.other = otherMidFunc(bounds); \
startPoint.main = mainMidFunc(bounds) + (-normalizedOffset.main) * 0.5 * mainSizeFunc(bounds); \
endPoint.main = mainMidFunc(bounds) + normalizedOffset.main * 0.5 * mainSizeFunc(bounds);

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
	
	if(normalizedOffset.x != 0)
	{
		DTX_CALC_SWIPE_START_END_POINTS(safeBounds, CGRectGetMidX, CGRectGetMidY, x, y, CGRectGetWidth);
	}
	else
	{
		DTX_CALC_SWIPE_START_END_POINTS(safeBounds, CGRectGetMidY, CGRectGetMidX, y, x, CGRectGetHeight);
	}
	
	[self dtx_assertHittableAtPoint:startPoint];
	
	startPoint = [self.window convertPoint:startPoint fromView:self];
	endPoint = [self.window convertPoint:endPoint fromView:self];
	
	_DTXApplySwipe(self.window, startPoint, endPoint, 1.0 / velocity);
}

__attribute__((always_inline))
static inline void _DTXApplyPinch(UIWindow* window, CGPoint startPoint1, CGPoint endPoint1, CGPoint startPoint2, CGPoint endPoint2, CGFloat velocity)
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

__attribute__((always_inline))
static inline void DTXCalcPinchStartEndPoints(CGRect bounds, CGFloat pixelsScale, CGFloat angle, CGPoint* startPoint1, CGPoint* endPoint1, CGPoint* startPoint2, CGPoint* endPoint2)
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

__attribute__((always_inline))
static inline CGFloat clamp(CGFloat v, CGFloat min, CGFloat max)
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
		DTXCViewAssert(firstResponder == nil, firstResponder, @"Failed to make view “%@” first responder", view.dtx_shortDescription);
	}
	
	return firstResponder;
}

static BOOL _assertFirstResponderSupportsTextInput(UIView* firstResponder)
{
	if([firstResponder conformsToProtocol:@protocol(UITextInput)])
	{
		return YES;
	}
	
	DTXCViewAssert(NO, firstResponder, @"First responder “%@” does not conform to “UITextInput” protocol", firstResponder);
	
	return NO;
}

//__attribute__((constructor))
//static void _DTXFixupKeyboard(void)
//{
//	static char const *const controllerPrefBundlePath = "/System/Library/PrivateFrameworks/TextInput.framework/TextInput";
//	__unused void *handle = dlopen(controllerPrefBundlePath, RTLD_LAZY);
//	
//	TIPreferencesController* controller = TIPreferencesController.sharedPreferencesController;
//	if([controller respondsToSelector:@selector(setAutocorrectionEnabled:)] == YES)
//	{
//		controller.autocorrectionEnabled = NO;
//	}
//	else
//	{
//		[controller setValue:@NO forPreferenceKey:@"KeyboardAutocorrection"];
//	}
//	
//	if([controller respondsToSelector:@selector(setPredictionEnabled:)])
//	{
//		controller.predictionEnabled = NO;
//	}
//	else
//	{
//		[controller setValue:@NO forPreferenceKey:@"KeyboardPrediction"];
//	}
//	
//	[controller setValue:@YES forPreferenceKey:@"DidShowGestureKeyboardIntroduction"];
//	if(UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone)
//	{
//		[controller setValue:@YES forPreferenceKey:@"DidShowContinuousPathIntroduction"];
//	}
//
//	[controller synchronizePreferences];
//}

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
	[self dtx_assertHittable];
	
	UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(self);
	
	_assertFirstResponderSupportsTextInput(firstResponder);
	
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
	[self dtx_assertHittable];
	
	UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(self);
	
	_assertFirstResponderSupportsTextInput(firstResponder);
	
	_DTXTypeText(text);
}

- (void)dtx_replaceText:(NSString*)text
{
	[self dtx_assertHittable];
	
	UIView<UITextInput>* firstResponder = (id)_ensureFirstResponderIfNeeded(self);
	
	_assertFirstResponderSupportsTextInput(firstResponder);
	
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

DTX_ALWAYS_INLINE
static NSDictionary* DTXInsetsToDictionary(UIEdgeInsets insets)
{
	return @{@"top": @(insets.top), @"bottom": @(insets.bottom), @"left": @(insets.left), @"right": @(insets.right)};
}

DTX_ALWAYS_INLINE
static NSDictionary* DTXRectToDictionary(CGRect rect)
{
	return @{@"x": @(rect.origin.x), @"y": @(rect.origin.y), @"width": @(rect.size.width), @"height": @(rect.size.height)};
}

DTX_ALWAYS_INLINE
static NSDictionary* DTXPointToDictionary(CGPoint point)
{
	return @{@"x": @(point.x), @"y": @(point.y)};
}

- (NSDictionary<NSString *,id> *)dtx_attributes
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	
	NSDictionary* results = [self dictionaryWithValuesForKeys:@[@"text", @"accessibilityLabel", @"accessibilityIdentifier", @"accessibilityValue", @"placeholder"]];
	[results enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
		if([obj isKindOfClass:NSNull.class])
		{
			return;
		}
		
		if([key isEqualToString:@"accessibilityLabel"])
		{
			rv[@"label"] = obj;
		}
		else if([key isEqualToString:@"accessibilityValue"])
		{
			rv[@"value"] = obj;
		}
		else if([key isEqualToString:@"accessibilityIdentifier"])
		{
			rv[@"identifier"] = obj;
		}
		else
		{
			rv[key] = obj;
		}
	}];
	
	BOOL enabled = self.userInteractionEnabled;
	if([self isKindOfClass:UIControl.class])
	{
		enabled = enabled && [[self valueForKey:@"enabled"] boolValue];
	}
	rv[@"enabled"] = enabled ? @YES : @NO;
	
	rv[@"frame"] = DTXRectToDictionary(self.dtx_accessibilityFrame);
	rv[@"elementFrame"] = DTXRectToDictionary(self.frame);
	rv[@"elementBounds"] = DTXRectToDictionary(self.bounds);
	rv[@"safeAreaInsets"] = DTXInsetsToDictionary(self.safeAreaInsets);
	rv[@"elementSafeBounds"] = DTXRectToDictionary(self.dtx_safeAreaBounds);
	
	CGPoint accessibilityActivationPointInViewCoordinateSpace = self.dtx_accessibilityActivationPointInViewCoordinateSpace;
	rv[@"activationPoint"] = DTXPointToDictionary(accessibilityActivationPointInViewCoordinateSpace);
	rv[@"normalizedActivationPoint"] = DTXPointToDictionary(CGPointMake(accessibilityActivationPointInViewCoordinateSpace.x / CGRectGetWidth(self.bounds), accessibilityActivationPointInViewCoordinateSpace.y / CGRectGetHeight(self.bounds)));
	
	rv[@"hittable"] = self.dtx_isHittable ? @YES : @NO;
	rv[@"visible"] = self.dtx_isVisible ? @YES : @NO;
	
	if([self isKindOfClass:UISlider.class])
	{
		rv[@"sliderPosition"] = @([(UISlider*)self dtx_normalizedSliderPosition]);
	}
	
	if([self isKindOfClass:UIDatePicker.class])
	{
		UIDatePicker* dp = (id)self;
		rv[@"date"] = [NSISO8601DateFormatter stringFromDate:dp.date timeZone:dp.timeZone ?: NSTimeZone.systemTimeZone formatOptions:NSISO8601DateFormatWithInternetDateTime | NSISO8601DateFormatWithDashSeparatorInDate | NSISO8601DateFormatWithColonSeparatorInTime | NSISO8601DateFormatWithColonSeparatorInTimeZone];
		NSDateComponents* dc = [dp.calendar componentsInTimeZone:dp.timeZone ?: NSTimeZone.systemTimeZone fromDate:dp.date];
		
		NSMutableDictionary* dateComponents = [NSMutableDictionary new];
		dateComponents[@"era"] = @(dc.era);
		dateComponents[@"year"] = @(dc.year);
		dateComponents[@"month"] = @(dc.month);
		dateComponents[@"day"] = @(dc.day);
		dateComponents[@"hour"] = @(dc.hour);
		dateComponents[@"minute"] = @(dc.minute);
		dateComponents[@"second"] = @(dc.second);
		dateComponents[@"weekday"] = @(dc.weekday);
		dateComponents[@"weekdayOrdinal"] = @(dc.weekdayOrdinal);
		dateComponents[@"quarter"] = @(dc.quarter);
		dateComponents[@"weekOfMonth"] = @(dc.weekOfMonth);
		dateComponents[@"weekOfYear"] = @(dc.weekOfYear);
		dateComponents[@"leapMonth"] = @(dc.leapMonth);
		
		rv[@"dateComponents"] = dateComponents;
	}
	
	return rv;
}

@end
