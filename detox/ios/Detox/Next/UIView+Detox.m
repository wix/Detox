//
//  UIView+Detox.m
//  ExampleApp
//
//  Created by Leo Natan (Wix) on 4/16/20.
//

#import "UIView+Detox.h"

#import "DTXSyntheticEvents.h"
#import "DTXAppleInternals.h"

@implementation UIView (Detox)

- (UIView*)dtx_visTest:(CGPoint)point withEvent:(UIEvent *)event;
{
	NSLog(@"Visiting %@", self);
	
	CGPoint localPoint = [self.window.screen.coordinateSpace convertPoint:point toCoordinateSpace:self.coordinateSpace];
	if([self pointInside:localPoint withEvent:event] == NO)
	{
		NSLog(@"- NOPE: !pointInside, frame: %@, point: %@, localPoint: %@", @([self.window.screen.coordinateSpace convertRect:self.bounds fromCoordinateSpace:self.coordinateSpace]), @(point), @(localPoint));
		
		return nil;
	}
	
	if(self.isHiddenOrHasHiddenAncestor == YES)
	{
		NSLog(@"- NOPE: hidden");
		
		return nil;
	}
	
	__block UIView* rv;
	
	//Front-most views get priority
	[self.subviews enumerateObjectsWithOptions:NSEnumerationReverse usingBlock:^(__kindof UIView * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		rv = [obj dtx_visTest:point withEvent:event];
		
		if(rv != nil)
		{
			NSLog(@"+ YEP: Using child %@", rv);
			*stop = YES;
		}
	}];
	
	if(rv == nil)
	{
		NSLog(@"+ YEP: self %@", self);
		rv = self;
	}
	
	return rv;
}

- (CGPoint)_dtx_accessibilityActivationPointInViewCoordinateSpace
{
	return [self.window.screen.coordinateSpace convertPoint:self.accessibilityActivationPoint toCoordinateSpace:self.coordinateSpace];
}

- (void)dtx_tapAtAccessibilityActivationPoint
{
	[self dtx_tapAtPoint:self._dtx_accessibilityActivationPointInViewCoordinateSpace numberOfTaps:1];
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

- (BOOL)dtx_isVisible
{
	if(CGRectContainsPoint(self.window.screen.bounds, self.accessibilityActivationPoint) == NO)
	{
		return NO;
	}
	
	if([self isHiddenOrHasHiddenAncestor] == YES)
	{
		return NO;
	}
	
	//Activation point in window coordinate space
	CGPoint activationPoint = [self.window.screen.coordinateSpace convertPoint:self.accessibilityActivationPoint toCoordinateSpace:self.window.coordinateSpace];
	
	
	id visibleView = [self.window dtx_visTest:activationPoint withEvent:nil];
	
	if(visibleView == self || [visibleView isDescendantOfView:self])
	{
		return YES;
	}
	
	return NO;
}

- (BOOL)dtx_isHittable
{
	if(CGRectContainsPoint(self.window.screen.bounds, self.accessibilityActivationPoint) == NO)
	{
		return NO;
	}
	
	if([self isHiddenOrHasHiddenAncestor] == YES)
	{
		return NO;
	}
	
	//Activation point in window coordinate space
	CGPoint activationPoint = [self.window.screen.coordinateSpace convertPoint:self.accessibilityActivationPoint toCoordinateSpace:self.window.coordinateSpace];
	
	
	id hitTestView = [self.window hitTest:activationPoint withEvent:nil];
	
	if(hitTestView == self || [[hitTestView _accessibilityHitTestSubviews] containsObject:self] || [[self _accessibilityHitTestSubviews] containsObject:hitTestView])
	{
		return YES;
	}
	
	return NO;
}

+ (void)_dtx_appendViewsRecursivelyFromArray:(NSArray<UIView*>*)views passingPredicate:(NSPredicate*)predicate storage:(NSMutableArray<UIView*>*)storage
{
	if(views.count == 0)
	{
		return;
	}
	
	[views enumerateObjectsUsingBlock:^(UIView * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		if(predicate == nil || [predicate evaluateWithObject:obj] == YES)
		{
			[storage addObject:obj];
		}
		
		[self _dtx_appendViewsRecursivelyFromArray:obj.subviews passingPredicate:predicate storage:storage];
	}];
}

+ (NSMutableArray<UIView*>*)dtx_findViewsInWindows:(NSArray<UIWindow*>*)windows passingPredicate:(NSPredicate*)predicate
{
	NSMutableArray<UIView*>* rv = [NSMutableArray new];
	
	[self _dtx_appendViewsRecursivelyFromArray:windows passingPredicate:predicate storage:rv];
	[self _dtx_sortViewsByCoords:rv];
	
	return rv;
}

+ (NSMutableArray<UIView*>*)dtx_findViewsInKeySceneWindowsPassingPredicate:(NSPredicate*)predicate
{
	return [self dtx_findViewsInWindows:[UIWindowScene _keyWindowScene].windows passingPredicate:predicate];
}

+ (void)_dtx_sortViewsByCoords:(NSMutableArray<UIView*>*)views
{
	[views sortUsingDescriptors:@[[NSSortDescriptor sortDescriptorWithKey:nil ascending:YES comparator:^NSComparisonResult(UIView* _Nonnull obj1, UIView* _Nonnull obj2) {
		CGRect frame1 = obj1.accessibilityFrame;
		CGRect frame2 = obj2.accessibilityFrame;
		
		return frame1.origin.y < frame2.origin.y ? NSOrderedAscending : frame1.origin.y > frame2.origin.y ? NSOrderedDescending : NSOrderedSame;
	}], [NSSortDescriptor sortDescriptorWithKey:nil ascending:YES comparator:^NSComparisonResult(UIView* _Nonnull obj1, UIView* _Nonnull obj2) {
		CGRect frame1 = obj1.accessibilityFrame;
		CGRect frame2 = obj2.accessibilityFrame;
		
		return frame1.origin.x < frame2.origin.x ? NSOrderedAscending : frame1.origin.x > frame2.origin.x ? NSOrderedDescending : NSOrderedSame;
	}]]];
}


@end
