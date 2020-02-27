//
//  _DTXXCUIElementProxy.m
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/12/20.
//

/***
*    ██╗    ██╗ █████╗ ██████╗ ███╗   ██╗██╗███╗   ██╗ ██████╗
*    ██║    ██║██╔══██╗██╔══██╗████╗  ██║██║████╗  ██║██╔════╝
*    ██║ █╗ ██║███████║██████╔╝██╔██╗ ██║██║██╔██╗ ██║██║  ███╗
*    ██║███╗██║██╔══██║██╔══██╗██║╚██╗██║██║██║╚██╗██║██║   ██║
*    ╚███╔███╔╝██║  ██║██║  ██║██║ ╚████║██║██║ ╚████║╚██████╔╝
*     ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝
*
*
* WARNING: This file compiles with ARC disabled! Take extra care when modifying or adding functionality.
*/

#import "_DTXXCUIElementProxy.h"
#import "DTXDetoxApplication.h"
@import ObjectiveC;

static void* syncProxyKey = &syncProxyKey;
static void* idleDisableCounterKey = &idleDisableCounterKey;

@interface DTXDetoxApplication (ProxyExtensions)

@property (nonatomic) NSUInteger _idleDisableCounter;

@end

@implementation DTXDetoxApplication (ProxyExtensions)

- (void)set_idleDisableCounter:(NSUInteger)_idleDisableCounter
{
	objc_setAssociatedObject(self, idleDisableCounterKey, @(_idleDisableCounter), OBJC_ASSOCIATION_RETAIN);
}

- (NSUInteger)_idleDisableCounter
{
	return [objc_getAssociatedObject(self, idleDisableCounterKey) unsignedIntegerValue];
}

@end

@implementation XCUIElement (ProxyExtensions)

- (void)_dtx_setSyncProxy:(_DTXXCUIElementProxy*)proxy
{
	objc_setAssociatedObject(self, syncProxyKey, proxy, OBJC_ASSOCIATION_ASSIGN);
}

- (_DTXXCUIElementProxy*)_dtx_syncProxy
{
	return objc_getAssociatedObject(self, syncProxyKey);
}

- (void)_dtx_waitForIdleAndDisable
{
	[self._dtx_syncProxy _dtx_waitForIdleAndDisable];
}

- (void)_dtx_enableIdle
{
	[self._dtx_syncProxy _dtx_enableIdle];
}

@end

@protocol _DTXXCUIElementCaptureList

@property (readonly) BOOL exists;
@property (readonly, getter = isHittable) BOOL hittable;
- (XCUIElementQuery *)descendantsMatchingType:(XCUIElementType)type;
- (XCUIElementQuery *)childrenMatchingType:(XCUIElementType)type;

- (void)typeText:(NSString *)text;
+ (void)performWithKeyModifiers:(XCUIKeyModifierFlags)flags block:(XCT_NOESCAPE void (^)(void))block;
- (void)typeKey:(NSString *)key modifierFlags:(XCUIKeyModifierFlags)flags;

- (void)tap;
- (void)doubleTap;
- (void)pressForDuration:(NSTimeInterval)duration;
- (void)pressForDuration:(NSTimeInterval)duration thenDragToElement:(XCUIElement *)otherElement;
- (void)twoFingerTap;
- (void)tapWithNumberOfTaps:(NSUInteger)numberOfTaps numberOfTouches:(NSUInteger)numberOfTouches;
- (void)swipeUp;
- (void)swipeDown;
- (void)swipeLeft;
- (void)swipeRight;
- (void)pinchWithScale:(CGFloat)scale velocity:(CGFloat)velocity;
- (void)rotate:(CGFloat)rotation withVelocity:(CGFloat)velocity;
- (void)adjustToNormalizedSliderPosition:(CGFloat)normalizedSliderPosition;
@property (readonly) CGFloat normalizedSliderPosition;
- (void)adjustToPickerWheelValue:(NSString *)pickerWheelValue;

@property (readonly) NSArray<id<XCUIElementSnapshot>> *children;

@end

static NSMutableSet* _syncedMethods;

@implementation _DTXXCUIElementProxy
{
	XCUIElement* _underlying;
}

+ (void)load
{
//	SEL name = NSSelectorFromString(@"initWithElementQuery:");
//	Method m = class_getInstanceMethod(XCUIElement.class, name);
//	id (*orig)(id, SEL, id) = (void*)method_getImplementation(m);
//	method_setImplementation(m, imp_implementationWithBlock(^ (id _self, id q) {
//		id rv = orig(_self, name, q);
//		
//		if([rv isMemberOfClass:XCUIElement.class])
//		{
//			rv = [[_DTXXCUIElementProxy alloc] initWithElement:rv];
//		}
//		
//		return rv;
//	}));
//	
//	_syncedMethods = [NSMutableSet new];
//	
//	unsigned int methodCount;
//	struct objc_method_description* methods = protocol_copyMethodDescriptionList(@protocol(_DTXXCUIElementCaptureList), YES, YES, &methodCount);
//	
//	for(unsigned int idx = 0; idx < methodCount; idx++)
//	{
//		[_syncedMethods addObject:NSStringFromSelector(methods[idx].name)];
//	}
//
//	if(methods)
//	{
//		free(methods);
//	}
}

- (instancetype)initWithElement:(XCUIElement*)element
{
	self = [super init];
	
	if(self)
	{
		_underlying = [element retain];
		[_underlying _dtx_setSyncProxy:self];
	}
	
	return self;
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector
{
	return [_underlying methodSignatureForSelector:aSelector];;
}

- (void)forwardInvocation:(NSInvocation *)anInvocation
{
	[self _dtx_waitForIdleIfNeededWithSelector:anInvocation.selector];
	
	[anInvocation invokeWithTarget:_underlying];
}

- (void)_dtx_waitForIdleIfNeededWithSelector:(SEL)selector
{
	DTXDetoxApplication* app = [_underlying valueForKey:@"application"];
	if([app isKindOfClass:DTXDetoxApplication.class] == NO)
	{
		return;
	}
	
	if(app._idleDisableCounter != 0)
	{
		return;
	}
	
	if(app._idleDisableCounter && (selector == nil || [_syncedMethods containsObject:NSStringFromSelector(selector)]))
	{
		[app waitForIdleWithTimeout:0];
	}
}

- (void)_dtx_waitForIdleAndDisable
{
	[self _dtx_waitForIdleIfNeededWithSelector:nil];
	
	DTXDetoxApplication* app = [_underlying valueForKey:@"application"];
	if([app isKindOfClass:DTXDetoxApplication.class] == NO)
	{
		return;
	}
	app._idleDisableCounter++;
	
	NSLog(@"👐 %@", @(app._idleDisableCounter));
}

- (void)_dtx_enableIdle
{
	DTXDetoxApplication* app = [_underlying valueForKey:@"application"];
	if([app isKindOfClass:DTXDetoxApplication.class] == NO)
	{
		return;
	}
	
	if(app._idleDisableCounter == 0)
	{
		NSLog(@"❌");
		
		return;
	}
	
	app._idleDisableCounter--;
	
	NSLog(@"🦠 %@", @(app._idleDisableCounter));
}

@end
