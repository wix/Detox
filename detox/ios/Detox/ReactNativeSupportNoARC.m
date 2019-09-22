//
//  ReactNativeSupportNoARC.m
//  Detox
//
//  Created by Leo Natan (Wix) on 3/27/19.
//  Copyright © 2019 Wix. All rights reserved.
//

#import "ReactNativeSupportNoARC.h"
#include <dlfcn.h>
#include "fishhook.h"

Class (*__orig_objc_lookUpClass)(const char * name);
Class __dtx_objc_lookUpClass(const char * name)
{
	void* nameptr = (void*)name;
	void* xctestptr = (void*)"XCTest";
	if(name != NULL && (nameptr == xctestptr || memcmp(nameptr, xctestptr, 6) == 0))
	{
		return nil;
	}
	
	return __orig_objc_lookUpClass(name);
}

__attribute__((constructor))
static void __setupRNSupport()
{
	//Use the "-disableRNTestingOverride 1" launch argument to disable this behavior.
	if([NSUserDefaults.standardUserDefaults boolForKey:@"disableRNTestingOverride"] == NO)
	{
		__orig_objc_lookUpClass = dlsym(RTLD_DEFAULT, "objc_lookUpClass");
		rebind_symbols((struct rebinding[]){
			{
				"objc_lookUpClass",
				__dtx_objc_lookUpClass,
				NULL
			}
		}, 1);
	}
}
