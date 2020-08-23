//
//  ReactNativeSupport.m
//  Detox
//
//  Created by Leo Natan (Wix) on 7/15/20.
//  Copyright © 2020 Wix. All rights reserved.
//

@import ObjectiveC;

@interface NSObject (DTXRNFix) @end
@implementation NSObject (DTXRNFix)

//Disable live reload for Detox
- (void)__detox_sync__reloadWithDefaults:(NSDictionary *)defaultValues
{
	NSMutableDictionary* dv = [defaultValues mutableCopy];
	dv[@"hotLoadingEnabled"] = @NO;
	
	[self __detox_sync__reloadWithDefaults:defaultValues];
	
	NSMutableDictionary* _settings = [self valueForKey:@"_settings"];
	_settings[@"hotLoadingEnabled"] = @NO;
	[NSUserDefaults.standardUserDefaults setObject:_settings forKey:@"RCTDevMenu"];
}

@end

__attribute__((constructor))
static void __setupRNSupport()
{
	Class cls = NSClassFromString(@"RCTDevSettingsUserDefaultsDataSource");
	if(cls != nil)
	{
		DTXSwizzleMethod(cls, NSSelectorFromString(@"_reloadWithDefaults:"), @selector(__detox_sync__reloadWithDefaults:), NULL);
	}
	
	cls = NSClassFromString(@"RCTPicker");
	if(cls != nil)
	{
		SEL sel = @selector(initWithFrame:);
		Method m = class_getInstanceMethod(cls, sel);
		
		if(m == nil)
		{
			return;
		}
		
		id (*orig)(id, SEL, CGRect) = (void*)method_getImplementation(m);
		method_setImplementation(m, imp_implementationWithBlock(^ (UIPickerView<UIPickerViewDataSource>* _self, CGRect frame) {
			_self = orig(_self, sel, frame);
			_self.dataSource = _self;
			
			return _self;
		}));
	}
}
