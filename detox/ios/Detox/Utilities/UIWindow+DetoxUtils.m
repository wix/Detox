//
//  UIWindow+DetoxUtils.m
//  Detox
//
//  Created by Leo Natan (Wix) on 6/4/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIWindow+DetoxUtils.h"

#import "DTXAppleInternals.h"
#import "NSObject+DetoxUtils.h"
#import "UIView+DetoxUtils.h"
#import <WebKit/WebKit.h>

extern NSArray* DTXChildElements(id element);

static NSInteger _DTXClampedInt(double value)
{
	return (NSInteger)MIN(MAX(value, (double)NSIntegerMin), (double)NSIntegerMax);
}

static NSString* _DTXEscapeXML(NSString* string)
{
	if(string == nil)
	{
		return @"";
	}

	NSMutableString* rv = [string mutableCopy];
	[rv replaceOccurrencesOfString:@"&" withString:@"&amp;" options:0 range:NSMakeRange(0, rv.length)];
	[rv replaceOccurrencesOfString:@"<" withString:@"&lt;" options:0 range:NSMakeRange(0, rv.length)];
	[rv replaceOccurrencesOfString:@">" withString:@"&gt;" options:0 range:NSMakeRange(0, rv.length)];
	[rv replaceOccurrencesOfString:@"\"" withString:@"&quot;" options:0 range:NSMakeRange(0, rv.length)];
	return rv;
}

static NSDictionary* _DTXGetElementAttributes(UIView* view)
{
	NSMutableDictionary* attributes = [NSMutableDictionary new];
	attributes[@"class"] = NSStringFromClass(view.class);
	attributes[@"width"] = @(_DTXClampedInt(CGRectGetWidth(view.frame))).stringValue;
	attributes[@"height"] = @(_DTXClampedInt(CGRectGetHeight(view.frame))).stringValue;
	attributes[@"visibility"] = view.hidden ? @"invisible" : @"visible";
	attributes[@"alpha"] = [NSString stringWithFormat:@"%.1f", view.alpha];
	attributes[@"focused"] = view.isFocused ? @"true" : @"false";

	if (view.accessibilityValue.length > 0) {
		attributes[@"value"] = view.accessibilityValue;
	}
	if (view.accessibilityLabel.length > 0) {
		attributes[@"label"] = view.accessibilityLabel;
	}
	if (view.tag != 0) {
		attributes[@"tag"] = @(view.tag).stringValue;
	}
	if (view.superview != nil) {
		CGPoint originInSuperview = [view convertPoint:CGPointZero toView:view.superview];
		attributes[@"x"] = @(_DTXClampedInt(originInSuperview.x)).stringValue;
		attributes[@"y"] = @(_DTXClampedInt(originInSuperview.y)).stringValue;
	}
	if (view.accessibilityIdentifier.length > 0) {
		attributes[@"id"] = view.accessibilityIdentifier;
	}

	NSString* text = [view dtx_text];
	if (text.length > 0) {
		attributes[@"text"] = text;
	}

	// Add memory address for unique identification and debugging
	attributes[@"ptr"] = [NSString stringWithFormat:@"%p", view];

	return attributes;
}

static void _DTXAppendRecursiveXMLDescription(id element, NSMutableString* storage, NSUInteger depth)
{
	if([element isKindOfClass:UIView.class] == NO)
	{
		return;
	}

	UIView* view = element;

	NSString* indent = [@"" stringByPaddingToLength:depth * 4 withString:@" " startingAtIndex:0];
	[storage appendFormat:@"\n%@", indent];

	NSString* elementName = NSStringFromClass(view.class);
	[storage appendFormat:@"<%@", elementName];

	NSDictionary* attributes = _DTXGetElementAttributes(view);
	NSArray* sortedKeys = [attributes.allKeys sortedArrayUsingSelector:@selector(compare:)];
	for(NSString* key in sortedKeys)
	{
		NSString* value = attributes[key];
		if(value.length > 0)
		{
			[storage appendFormat:@" %@=\"%@\"", key, _DTXEscapeXML(value)];
		}
	}

	NSArray* children = DTXChildElements(element);
	if([element isKindOfClass:WKWebView.class])
	{
		[storage appendString:@">"];
		[storage appendFormat:@"\n%@    <![CDATA[WebView content cannot be extracted synchronously.]]>", indent];
		[storage appendFormat:@"\n%@</%@>", indent, elementName];
		return;
	}

	if (children.count == 0)
	{
		[storage appendString:@" />"];
	}
	else
	{
		[storage appendString:@">"];
		for(id child in [children reverseObjectEnumerator])
		{
			_DTXAppendRecursiveXMLDescription(child, storage, depth + 1);
		}
		[storage appendFormat:@"\n%@</%@>", indent, elementName];
	}
}

static NSString* _DTXNSStringFromUISceneActivationState(UISceneActivationState state)
{
	switch(state)
	{
		case UISceneActivationStateBackground:
			return @"UISceneActivationStateBackground";
		case UISceneActivationStateForegroundActive:
			return @"UISceneActivationStateForegroundActive";
		case UISceneActivationStateForegroundInactive:
			return @"UISceneActivationStateForegroundInactive";
		case UISceneActivationStateUnattached:
			return @"UISceneActivationStateUnattached";
	}
}

@implementation UIWindowScene (DetoxUtils)

- (NSString*)dtx_recursiveDescription
{
	NSMutableString* rv;
	@autoreleasepool {
		rv = [NSMutableString stringWithString:@"<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<ViewHierarchy>"];

		NSArray<UIWindow*>* windows = [UIWindow dtx_allWindowsForScene:self];
		for (UIWindow* window in windows)
		{
			//Ignore the touch visualizer window
			if([NSStringFromClass(window.class) isEqualToString:@"DTXTouchVisualizerWindow"])
			{
				continue;
			}
			_DTXAppendRecursiveXMLDescription(window, rv, 1);
		}

		[rv appendString:@"\n</ViewHierarchy>"];
	}

	return rv;
}

@end

@implementation UIWindow (DetoxUtils)

+ (UIWindow*)dtx_keyWindow {
  NSArray *windows = [[UIApplication sharedApplication]windows];
  for (UIWindow *window in windows) {
	  if (window.isKeyWindow) {
		  return window;
	  }
  }
  return nil;
}

+ (id)dtx_keyWindowScene
{
	UIWindow* keyWindow = [self dtx_keyWindow];
	UIWindowScene* scene = keyWindow ? keyWindow.windowScene :  nil;
	return scene;
}

+ (NSArray<UIWindow *> *)dtx_allKeyWindowSceneWindows
{
	UIWindowScene* scene = [self dtx_keyWindowScene];
	return [self dtx_allWindowsForScene:scene];
}

+ (NSArray<UIWindow*>*)dtx_allWindowsForScene:(UIWindowScene*)scene
{
	NSMutableArray<UIWindow*>* windows = [[self dtx_allWindows] mutableCopy];
	scene = scene ?: [self dtx_keyWindowScene];
	if(scene != nil)
	{
		NSPredicate* predicate = [NSPredicate predicateWithFormat:@"windowScene == %@", scene];

		UIScene* keyboardScene = [UIWindowScene _keyboardWindowSceneForScreen:[scene screen] create:NO];
		if(keyboardScene != nil)
		{
			predicate = [NSCompoundPredicate orPredicateWithSubpredicates:@[predicate, [NSPredicate predicateWithFormat:@"windowScene == %@", keyboardScene]]];
		}

		[windows filterUsingPredicate:predicate];
	}

	return windows;
}

+ (NSArray<UIWindow*>*)dtx_allWindows
{
	return [[UIWindow allWindowsIncludingInternalWindows:YES onlyVisibleWindows:NO] filteredArrayUsingPredicate:[NSPredicate predicateWithFormat:@"hidden == NO"]];
}

+ (void)_dtx_enumerateWindows:(NSArray<UIWindow*>*)windows usingBlock:(void (NS_NOESCAPE ^)(UIWindow* obj, NSUInteger idx, BOOL *stop))block
{
	NSUInteger idx = 0;
	for (UIWindow * _Nonnull obj in windows.reverseObjectEnumerator)
	{
		BOOL stop = NO;
		block(obj, idx, &stop);
		if(stop == YES)
		{
			break;
		}
	}
}

+ (void)dtx_enumerateAllWindowsUsingBlock:(void (NS_NOESCAPE ^)(UIWindow* obj, NSUInteger idx, BOOL *stop))block
{
	[self _dtx_enumerateWindows:self.dtx_allWindows usingBlock:block];
}

+ (void)dtx_enumerateKeyWindowSceneWindowsUsingBlock:(void (NS_NOESCAPE ^)(UIWindow* obj, NSUInteger idx, BOOL *stop))block
{
	UIWindowScene* scene = [self dtx_keyWindowScene];
	[self dtx_enumerateWindowsInScene:scene usingBlock:block];
}

+ (void)dtx_enumerateWindowsInScene:(UIWindowScene*)scene usingBlock:(void (NS_NOESCAPE ^)(UIWindow* obj, NSUInteger idx, BOOL *stop))block
{
	[self _dtx_enumerateWindows:[self dtx_allWindowsForScene:scene] usingBlock:block];
}

- (NSString *)dtx_shortDescription
{
	CGRect frame = self.frame;

	return [NSString stringWithFormat:@"<%@: %p; frame = (%@ %@; %@ %@);>", self.class, self, @(frame.origin.x), @(frame.origin.y), @(frame.size.width), @(frame.size.height)];
}

+ (nullable UIWindow *)dtx_topMostWindowAtPoint:(CGPoint)point {
  NSArray<UIWindow *> *windows = [self dtx_allWindows];

  NSArray<UIWindow *> *visibleWindowsAtPoint = [windows filteredArrayUsingPredicate:
		[NSPredicate predicateWithBlock:^BOOL(
			UIWindow *window,
			NSDictionary<NSString *, id> * _Nullable __unused bindings
		) {
			if (!CGRectContainsPoint(window.frame, point)) {
				return NO;
			}

			if (![window isVisibleAroundPoint:point]) {
				return NO;
			}

			if (![window hitTest:point withEvent:nil]) {
				// The point lies completely outside the window's hierarchy.
				return NO;
			}

			return YES;
		}]];

	if (!visibleWindowsAtPoint) {
		return nil;
  }

  return [[visibleWindowsAtPoint
	  sortedArrayUsingComparator:^NSComparisonResult(UIWindow *window1, UIWindow *window2) {
		return window1.windowLevel - window2.windowLevel;
	}] lastObject];
}

@end
