//
//  WKWebViewConfiguration+Detox.m (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

#import "WKWebViewConfiguration+Detox.h"

@import ObjectiveC;

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
/// Backwards compatible implementation for iOS < 18 and iOS 18+
void DTXPreferencesSetWebSecurityEnabled(WKPreferences* prefs, bool enabled) {
	if (!prefs) return;
	
	if (@available(iOS 18.0, *)) {
		void *prefsPtr = (__bridge void *)(prefs);
        WKPreferencesRef prefsRef = (WKPreferencesRef)prefsPtr;
        WKPreferencesSetWebSecurityEnabled(prefsRef, enabled);
        
	} else {
		DTXFakeWKPreferencesRef* fakeRef = [DTXFakeWKPreferencesRef new];
		
		Ivar ivar = class_getInstanceVariable([WKPreferences class], "_preferences");
		void* realPreferences = (void*)(((uintptr_t)prefs) + ivar_getOffset(ivar));
		fakeRef._apiObject = realPreferences;
		
		WKPreferencesSetWebSecurityEnabled((__bridge WKPreferencesRef)fakeRef, enabled);
	}
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
