//
//  WKWebViewConfiguration+Detox.m (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

#import "WKWebViewConfiguration+Detox.h"

@import ObjectiveC;

void WKPreferencesSetWebSecurityEnabled(id, bool);

@interface DTXFakeWKPreferencesRef: NSObject
@property (nonatomic) void* _apiObject;
@end

@implementation DTXFakeWKPreferencesRef
@end

/// Set web-security policy for WebKit (e.g. CORS restriction).
///
/// @note Since we can't access the `WKPreferencesSetWebSecurityEnabled` directly with
///  a `WKPreferences*`, we wrap it in a `WKPreferencesRef`, which can be passed to this function.
/// This private API is not officially supported on iOS, and generally used for debugging / testing
///  purposes on MacOS only. So there's no guarantee that it will work in the future.
void DTXPreferencesSetWebSecurityEnabled(WKPreferences* prefs, bool enabled) {
	DTXFakeWKPreferencesRef* fakeRef = [DTXFakeWKPreferencesRef new];

	Ivar ivar = class_getInstanceVariable([WKPreferences class], "_preferences");
	void* realPreferences = (void*)(((uintptr_t)prefs) + ivar_getOffset(ivar));
	fakeRef._apiObject = realPreferences;

	WKPreferencesSetWebSecurityEnabled(fakeRef, enabled);
}

@implementation WKWebViewConfiguration (Detox)

+ (void)load {
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
