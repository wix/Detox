//
//  UIWindow+DetoxUtils.m
//  Detox
//
//  Created by Leo Natan (Wix) on 6/4/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIWindow+DetoxUtils.h"
#import "NSObject+DetoxUtils.h"
#import "DTXAppleInternals.h"

extern NSArray* DTXChildElements(id element);

static void _DTXElementDescription(NSObject<UIAccessibilityIdentification>* element, NSMutableString* storage)
{
	[storage appendFormat:@"<%@: %p", element.class, element];
	
	if([element __isKindOfUIView])
	{
		UIView* view = (id)element;
		CGRect frame = view.frame;
		[storage appendFormat:@"; frame = (%g %g; %g %g)", frame.origin.x, frame.origin.y, frame.size.width, frame.size.height];
	}
	else
	{
		CGRect axFrame = [element dtx_bounds];
		[storage appendFormat:@"; ax.frame = (%g %g; %g %g)", axFrame.origin.x, axFrame.origin.y, axFrame.size.width, axFrame.size.height];
	}
	
	NSString* identifier = [element respondsToSelector:@selector(accessibilityIdentifier)] ? [element accessibilityIdentifier] : nil;
	if(identifier.length > 0)
	{
		[storage appendFormat:@"; ax.id = \"%@\"", identifier];
	}
	
	NSString* text = [[element dtx_text] stringByReplacingOccurrencesOfString:@"\n" withString:@" "];
	if(text.length > 0)
	{
		[storage appendFormat:@"; text = \"%@\"", text];
	}
	
	NSString* label = [[element accessibilityLabel] stringByReplacingOccurrencesOfString:@"\n" withString:@" "];
	if(label.length > 0)
	{
		[storage appendFormat:@"; ax.label = \"%@\"", label];
	}
	
	NSString* value = [[element accessibilityValue] stringByReplacingOccurrencesOfString:@"\n" withString:@" "];
	if(value.length > 0)
	{
		[storage appendFormat:@"; ax.value = \"%@\"", value];
	}
	
	if([element __isKindOfUIView])
	{
		UIView* view = (id)element;
		CALayer* layer = view.layer;
		[storage appendFormat:@"; layer = <%@: %p>", layer.class, layer];
	}

	[storage appendString:@">"];
	
	//	+ <AnnoyingWindow: 0x7fa2f2c1d760; baseClass = UIWindow; frame = (0 0; 428 926); autoresize = W+H; gestureRecognizers = <NSArray: 0x600002ffb3c0>; layer = <UIWindowLayer: 0x600002781960>>
	
//	[storage appendString:view.description];
}

static void _DTXRecursiveDescribe(id element, NSMutableString* storage, NSUInteger level)
{
	if(level == 1)
	{
		[storage appendString:@"   + "];
	}
	else
	{
		for(NSUInteger idx = 0; idx < level; idx++)
		{
			[storage appendString:@"   | "];
		}
	}
	
	_DTXElementDescription(element, storage);
	[storage appendString:@"\n"];
	
	NSArray* children = DTXChildElements(element);
	for(id child in children)
	{
		_DTXRecursiveDescribe(child, storage, level + 1);
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
		id x = [self valueForKey:@"_FBSScene"];
		id y = [x valueForKey:@"identifier"];
		id z = [self valueForKeyPath:@"session.persistentIdentifier"];
		
		rv = [NSMutableString stringWithFormat:@"<%@: %p; scene = <%@: %p; identifier: %@>; persistentIdentifier = %@; activationState = %@>\n", self.class, self, [x class], x, y, z, _DTXNSStringFromUISceneActivationState(self.activationState)];
		
		NSArray<UIWindow*>* windows = [UIWindow dtx_allWindowsForScene:self];
		for (UIWindow* window in windows)
		{
			//Ignore the touch visualizer window
			if([NSStringFromClass(window.class) isEqualToString:@"DTXTouchVisualizerWindow"])
			{
				continue;
			}
			_DTXRecursiveDescribe(window, rv, 1);
		}
	}
	
	return rv;
}

@end

@implementation UIWindow (DetoxUtils)

+ (UIWindow*)dtx_keyWindow
{
    UIWindow *foundWindow = nil;
    NSArray *windows = [[UIApplication sharedApplication]windows];
    for (UIWindow *window in windows) {
        if (window.isKeyWindow) {
            foundWindow = window;
            break;
        }
    }
    return foundWindow;
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

@end
