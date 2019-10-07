//
//  UIDatePicker+TestSupport.m
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 10/7/19.
//

#import "UIDatePicker+TestSupport.h"
@import ObjectiveC;

@interface UIDatePicker ()

- (void)_emitValueChanged;

@end

static NSUInteger _ignoringEvents = 0;
static NSMutableSet<UIDatePicker*>* _awaitingEvents;

@implementation UIDatePicker (TestSupport)

+ (void)dtx_beginDelayingTimePickerEvents
{
	_ignoringEvents++;
}

+ (void)dtx_endDelayingTimePickerEventsWithCompletionHandler:(dispatch_block_t)completionHandler
{
	if(_ignoringEvents == 0)
	{
		return;
	}
	
	_ignoringEvents--;
	
	if(_ignoringEvents == 0)
	{
		[self dtx_flushPendingEvents];
	}
	
	if(completionHandler)
	{
		completionHandler();
	}
}

+ (void)dtx_flushPendingEvents
{
	for(UIDatePicker* datePicker in _awaitingEvents)
	{
		[datePicker _emitValueChanged];
	}
	
	[_awaitingEvents removeAllObjects];
}

+ (void)load
{
	_awaitingEvents = [NSMutableSet new];
	
	Class cls = UIDatePicker.class;
	SEL sel = @selector(_emitValueChanged);
	Method m = class_getInstanceMethod(cls, sel);
	void (*emitValueChanged)(id, SEL) = (void*)method_getImplementation(m);
	
	method_setImplementation(m, imp_implementationWithBlock(^(id _self) {
		if(_ignoringEvents == NO)
		{
			emitValueChanged(_self, sel);
			
			return;
		}
		
		[_awaitingEvents addObject:_self];
	}));
}

@end
