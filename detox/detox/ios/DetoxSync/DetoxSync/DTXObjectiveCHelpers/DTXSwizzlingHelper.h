//
//  DTXSwizzlingHelper.h
//  DTXObjectiveCHelpers
//
//  Created by Leo Natan (Wix) on 12/4/19.
//

#ifndef DTXSwizzlingHelper_h
#define DTXSwizzlingHelper_h
#if __OBJC__

#import <objc/runtime.h>

#ifdef DEBUG
#define SWIZ_TRAP() raise(SIGTRAP);
#else
#define SWIZ_TRAP()
#endif

#define SetNSErrorFor(FUNC, ERROR_VAR, FORMAT,...)	\
	NSString *errStr = [NSString stringWithFormat:@"%s: " FORMAT,FUNC,##__VA_ARGS__]; \
	NSLog(@"%@", errStr); \
	SWIZ_TRAP() \
	if (ERROR_VAR) {	\
		*ERROR_VAR = [NSError errorWithDomain:@"NSCocoaErrorDomain" \
										 code:-1	\
									 userInfo:@{NSLocalizedDescriptionKey:errStr}]; \
	}
#define SetNSError(ERROR_VAR, FORMAT,...) SetNSErrorFor(__func__, ERROR_VAR, FORMAT, ##__VA_ARGS__)

#define GetClass(obj)	object_getClass(obj)

#ifndef DTX_ALWAYS_INLINE
#define DTX_ALWAYS_INLINE inline __attribute__((__always_inline__))
#endif /* DTX_ALWAYS_INLINE */

DTX_ALWAYS_INLINE
static BOOL DTXSwizzleMethod(Class cls, SEL orig, SEL alt, NSError** error)
{
	Method origMethod = class_getInstanceMethod(cls, orig);
	if (!origMethod) {
		SetNSError(error, @"original method %@ not found for class %@", NSStringFromSelector(orig), cls);
		return NO;
	}
	
	Method altMethod = class_getInstanceMethod(cls, alt);
	if (!altMethod) {
		SetNSError(error, @"alternate method %@ not found for class %@", NSStringFromSelector(alt), cls);
		return NO;
	}
	
	class_addMethod(cls, orig, class_getMethodImplementation(cls, orig), method_getTypeEncoding(origMethod));
	class_addMethod(cls, alt, class_getMethodImplementation(cls, alt), method_getTypeEncoding(altMethod));
	
	method_exchangeImplementations(class_getInstanceMethod(cls, orig), class_getInstanceMethod(cls, alt));
	return YES;
}

DTX_ALWAYS_INLINE
static BOOL DTXSwizzleClassMethod(Class cls, SEL orig, SEL alt, NSError** error)
{
	return DTXSwizzleMethod(GetClass((id)cls), orig, alt, error);
}

DTX_ALWAYS_INLINE
static void __DTXCopyMethods(Class orig, Class target)
{
	//Copy class methods
	Class targetMetaclass = object_getClass(target);
	
	unsigned int methodCount = 0;
	Method *methods = class_copyMethodList(object_getClass(orig), &methodCount);
	
	for (unsigned int i = 0; i < methodCount; i++)
	{
		Method method = methods[i];
		if(strcmp(sel_getName(method_getName(method)), "load") == 0 || strcmp(sel_getName(method_getName(method)), "initialize") == 0)
		{
			continue;
		}
		class_addMethod(targetMetaclass, method_getName(method), method_getImplementation(method), method_getTypeEncoding(method));
	}
	
	free(methods);
	
	//Copy instance methods
	methods = class_copyMethodList(orig, &methodCount);
	
	for (unsigned int i = 0; i < methodCount; i++)
	{
		Method method = methods[i];
		class_addMethod(target, method_getName(method), method_getImplementation(method), method_getTypeEncoding(method));
	}
	
	free(methods);
}

DTX_ALWAYS_INLINE
static BOOL DTXDynamicallySubclass(id obj, Class target)
{
	SEL canarySEL = NSSelectorFromString([NSString stringWithFormat:@"__dtx_canaryInTheCoalMine_%@", NSStringFromClass(target)]);
	if([obj respondsToSelector:canarySEL])
	{
		//Already there.
		return YES;
	}
	
	NSString* clsName = [NSString stringWithFormat:@"%@(%@)", NSStringFromClass(object_getClass(obj)), NSStringFromClass(target)];
	Class cls = objc_getClass(clsName.UTF8String);
	
	if(cls == nil)
	{
		cls = objc_allocateClassPair(object_getClass(obj), clsName.UTF8String, 0);
		__DTXCopyMethods(target, cls);
		class_addMethod(cls, canarySEL, imp_implementationWithBlock(^ (id _self) {}), "v16@0:8");
		objc_registerClassPair(cls);
	}
	
	NSMutableDictionary* superRegistrar = objc_getAssociatedObject(obj, (void*)&objc_setAssociatedObject);
	if(superRegistrar == nil)
	{
		superRegistrar = [NSMutableDictionary new];
	}
	
	superRegistrar[NSStringFromClass(target)] = object_getClass(obj);
	
	object_setClass(obj, cls);
	objc_setAssociatedObject(obj, (void*)&objc_setAssociatedObject, superRegistrar, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
	
	return YES;
}

DTX_ALWAYS_INLINE
static Class DTXDynamicSubclassSuper(id obj, Class dynamic)
{
	NSMutableDictionary* superRegistrar = objc_getAssociatedObject(obj, (void*)&objc_setAssociatedObject);
	Class cls = superRegistrar[NSStringFromClass(dynamic)];
	if(cls == nil)
	{
		cls = class_getSuperclass(object_getClass(obj));
	}
	
	return cls;
}

#endif /* __OBJC__ */
#endif /* DTXSwizzlingHelper_h */
