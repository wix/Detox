//
//  WKWebViewConfiguration+Detox.m (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

#import "WKWebViewConfiguration+Detox.h"

@import ObjectiveC;


//void WKPreferencesSetWebSecurityEnabled(id, bool);


// Private WebKit API declarations
typedef struct OpaqueWKPreferences* WKPreferencesRef;
extern void WKPreferencesSetWebSecurityEnabled(WKPreferencesRef, bool);


@interface WKWebView (DetoxSecurity)
- (instancetype)dtx_initWithFrame:(CGRect)frame configuration:(WKWebViewConfiguration *)configuration;
@end


@interface DTXFakeWKPreferencesRef: NSObject
@property (nonatomic) void* _apiObject;
@end

@implementation DTXFakeWKPreferencesRef
@end


/// Set web-security policy for WebKit (e.g. CORS restriction).
///
/// @note Since we can't access the `WKPreferencesSetWebSecurityEnabled` directly with
///  a `WKPreferences*`, we wrap it in a `WKPreferencesRef` in the getWKPrefsRef function, which can be passed to this function.
/// This private API is not officially supported on iOS, and generally used for debugging / testing
///  purposes on MacOS only. So there's no guarantee that it will work in the future.
void DTXPreferencesSetWebSecurityEnabled(WKPreferences* prefs, bool enabled) {
    Ivar ivar = NULL;
    
    if (@available(iOS 18.0, *)) {
        unsigned int ivarCount;
        Ivar *ivars = class_copyIvarList([WKPreferences class], &ivarCount);
        if (ivars) {
            for (unsigned int i = 0; i < ivarCount; i++) {
                const char *ivarName = ivar_getName(ivars[i]);
                if (ivarName && strcmp(ivarName, "_preferences") == 0) {
                    ivar = ivars[i];
                    break;
                }
            }
            free(ivars);
        }
    } else {
        ivar = class_getInstanceVariable([WKPreferences class], "_preferences");
    }
    
    DTXFakeWKPreferencesRef* fakeRef = [DTXFakeWKPreferencesRef new];
    void* realPreferences = (void*)(((uintptr_t)prefs) + ivar_getOffset(ivar));
    fakeRef._apiObject = realPreferences;
    WKPreferencesSetWebSecurityEnabled((__bridge WKPreferencesRef)fakeRef, enabled);
}

@implementation WKWebViewConfiguration (Detox)

+ (void)load {
    [self swizzleWKWebViewConfigurationSetPreferences];
    
    if (@available(iOS 18.0, *)) {
        [self swizzleWKWebViewInitWithFrameConfiguration];
    }
}

+ (void)swizzleWKWebViewConfigurationSetPreferences {
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		Class class = [self class];
		
		SEL originalSelector = @selector(setPreferences:);
		SEL swizzledSelector = @selector(dtx_setPreferences:);

		Method originalMethod = class_getInstanceMethod(class, originalSelector);
		Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

		BOOL didAddMethod = class_addMethod(class,
											originalSelector,
											method_getImplementation(swizzledMethod),
											method_getTypeEncoding(swizzledMethod));

		if (didAddMethod) {
			class_replaceMethod(class,
							swizzledSelector,
							method_getImplementation(originalMethod),
							method_getTypeEncoding(originalMethod));
		} else {
			method_exchangeImplementations(originalMethod, swizzledMethod);
		}
	});
}

+ (void)swizzleWKWebViewInitWithFrameConfiguration {
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		Class wkWebViewClass = [WKWebView class];
		
		SEL originalSelector = @selector(initWithFrame:configuration:);
		SEL swizzledSelector = @selector(dtx_initWithFrame:configuration:);

		Method originalMethod = class_getInstanceMethod(wkWebViewClass, originalSelector);
		Method swizzledMethod = class_getInstanceMethod(wkWebViewClass, swizzledSelector);

		BOOL didAddMethod = class_addMethod(wkWebViewClass,
											originalSelector,
											method_getImplementation(swizzledMethod),
											method_getTypeEncoding(swizzledMethod));

		if (didAddMethod) {
			class_replaceMethod(wkWebViewClass,
							swizzledSelector,
							method_getImplementation(originalMethod),
							method_getTypeEncoding(originalMethod));
		} else {
			method_exchangeImplementations(originalMethod, swizzledMethod);
		}
	});
}

- (void)dtx_setPreferences:(WKPreferences *)preferences {
    if ([self shouldDisableWebKitSecurity]) {
        DTXPreferencesSetWebSecurityEnabled(preferences, NO);
    }
    [self dtx_setPreferences:preferences];
}

- (BOOL)shouldDisableWebKitSecurity {
    return [NSUserDefaults.standardUserDefaults boolForKey:@"detoxDisableWebKitSecurity"];
}

@end


@implementation WKWebView (DetoxSecurity)

- (instancetype)dtx_initWithFrame:(CGRect)frame configuration:(WKWebViewConfiguration *)configuration {
    BOOL shouldDisable = [configuration shouldDisableWebKitSecurity];
	if (shouldDisable) {
		if (!configuration.preferences) {
			configuration.preferences = [[WKPreferences alloc] init];
		}
		
		DTXPreferencesSetWebSecurityEnabled(configuration.preferences, !shouldDisable);
	}
	
	return [self dtx_initWithFrame:frame configuration:configuration];
}

@end
