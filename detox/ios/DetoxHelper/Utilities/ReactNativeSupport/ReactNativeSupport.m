//
//  ReactNativeSupport.m
//  Detox
//
//  Created by Tal Kol on 6/28/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "ReactNativeSupport.h"

#include <dlfcn.h>
#include <stdatomic.h>
#include "fishhook.h"
@import UIKit;
@import ObjectiveC;
@import Darwin;

DTX_CREATE_LOG(ReactNativeSupport);

__attribute__((constructor))
static void __setupRNSupport()
{
	Class cls = NSClassFromString(@"RCTModuleData");
	if(cls == nil)
	{
		return;
	}
	
	//🤦‍♂️ RN doesn't set the data source and relies on undocumented behavior.
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

@implementation ReactNativeSupport

+ (BOOL) isReactNativeApp
{
    return (NSClassFromString(@"RCTBridge") != nil);
}

+ (void)reloadApp
{
	if(NSClassFromString(@"RCTBridge") == nil)
	{
		//Not RN app - noop.
		return;
	}
	
	id bridge = [NSClassFromString(@"RCTBridge") valueForKey:@"currentBridge"];
	
	SEL reqRelSel = NSSelectorFromString(@"requestReload");
	if([bridge respondsToSelector:reqRelSel])
	{
		Method m = class_getInstanceMethod([bridge class], reqRelSel);
		void (*imp)(id, SEL) = (void*)method_getImplementation(m);
		//Call RN public API to request reload.
		imp(bridge, reqRelSel);
	}
	else
	{
		//Legacy call to reload RN.
		[[NSNotificationCenter defaultCenter] postNotificationName:@"RCTReloadNotification"
															object:nil
														  userInfo:nil];
	}
}

@end
