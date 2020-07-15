//
//  RNPickerCrap.m
//  Detox
//
//  Created by Leo Natan (Wix) on 7/15/20.
//  Copyright © 2020 Wix. All rights reserved.
//

@import ObjectiveC;

__attribute__((constructor))
static void __setupRNPickerCrapFix()
{
	Class cls = NSClassFromString(@"RCTPicker");
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
