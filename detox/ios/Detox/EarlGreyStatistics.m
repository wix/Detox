//
//  EarlGreyStatistics.m
//  Detox
//
//  Created by Leo Natan (Wix) on 19/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "EarlGreyStatistics.h"
#import "EarlGreyExtensions.h"
#import <EarlGrey/GREYAppStateTracker.h>
#import "GREYIdlingResourcePrettyPrint.h"

NSDictionary<NSString*, NSDictionary*(^)(id<GREYIdlingResource>)>* _prettyPrinters;
NSDictionary<NSString*, NSString*>* _prettyNames;

DTX_CREATE_LOG(EarlGreyStatistics)

#define CLS_STR(__cls) NSStringFromClass([__cls class])

@import ObjectiveC;

NSArray *WXClassesConformingToProtocol(Protocol* protocol)
{
	NSMutableArray* rv = [NSMutableArray new];
	
	int numberOfClasses = objc_getClassList(NULL, 0);
	Class* classList = (__unsafe_unretained Class*)malloc(sizeof(Class) * numberOfClasses);
	numberOfClasses = objc_getClassList(classList, numberOfClasses);
	
	for (int idx = 0; idx < numberOfClasses; idx++)
	{
		Class class = classList[idx];
		if (class_conformsToProtocol(class, protocol))
		{
			[rv addObject:class];
		}
	}
	
	free(classList);
	
	return rv;
}

void WXFixupIdlingResourceClasses()
{
	if([NSUserDefaults.standardUserDefaults boolForKey:@"detoxPrintBusyIdleResources"] == NO)
	{
		return;
	}
	
	NSArray<Class>* classes = WXClassesConformingToProtocol(@protocol(GREYIdlingResource));
	
	[classes enumerateObjectsUsingBlock:^(Class  _Nonnull cls, NSUInteger idx, BOOL * _Nonnull stop) {
		Method m = class_getInstanceMethod(cls, @selector(isIdleNow));
		
		BOOL (*origIsIdleNow)(id, SEL) = (BOOL(*)(id, SEL))method_getImplementation(m);
		method_setImplementation(m, imp_implementationWithBlock(^ BOOL (id<GREYIdlingResource> _self) {
			BOOL rv = origIsIdleNow(_self, @selector(isIdleNow));
			
			if(rv == NO)
			{
				NSString* prettyName = _prettyNames[CLS_STR(_self)] ?: _self.idlingResourceName;
				NSDictionary* (^prettyPrinter)(id<GREYIdlingResource>) = _prettyPrinters[CLS_STR(_self)] ?: ^ (id<GREYIdlingResource> res) { return @{}; };
				dtx_log_debug(@"%@ -> busy %@", prettyName, prettyPrinter(_self)[@"prettyPrint"]);
			}
			
			return rv;
		}));
	}];
}

@implementation EarlGreyStatistics

+ (void)load
{
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		_prettyNames = @{
						 CLS_STR(GREYAppStateTracker)						: @"App State",
						 CLS_STR(GREYDispatchQueueIdlingResource)			: @"Dispatch Queue",
						 CLS_STR(GREYManagedObjectContextIdlingResource)	: @"Managed Object Context",
						 CLS_STR(GREYNSTimerIdlingResource)					: @"Timer",
						 CLS_STR(GREYOperationQueueIdlingResource)			: @"Operation Queue",
						 CLS_STR(GREYTimedIdlingResource)					: @"Timed",
						 @"GREYUIWebViewIdlingResource"						: @"WebView",
						 CLS_STR(WXJSTimerObservationIdlingResource)		: @"JavaScript Timers",
						 CLS_STR(WXRNLoadIdlingResource)					: @"ReactNative JS Loading",
						 };
		
		_prettyPrinters = @{
							CLS_STR(GREYAppStateTracker)					  : ^ (id tracker)	 { return _prettyPrintAppStateTracker(tracker); },
							CLS_STR(GREYDispatchQueueIdlingResource)		  : ^ (id queue)     { return _prettyPrintDispatchQueueIdlingResource(queue); },
							CLS_STR(GREYManagedObjectContextIdlingResource)   : ^ (id ctx)		 { return _prettyPrintManagedObjectContextIdlingResource(ctx); },
							CLS_STR(GREYNSTimerIdlingResource)                : ^ (id timer)	 { return _prettyPrintTimerIdlingResource(timer); },
							CLS_STR(GREYOperationQueueIdlingResource)         : ^ (id opQ)		 { return _prettyPrintOperationQueueIdlingResource(opQ); },
							CLS_STR(GREYTimedIdlingResource)                  : ^ (id timed)	 { return _prettyPrintTimedIdlingResource(timed); },
							@"GREYUIWebViewIdlingResource"                    : ^ (id webview)	 { return _prettyPrintWebViewIdlingResource(webview); },
							CLS_STR(WXJSTimerObservationIdlingResource)       : ^ (id jsTimers)	 { return _prettyPrintJSTimerObservationIdlingResource(jsTimers); },
							CLS_STR(WXRunLoopIdlingResource)			      : ^ (id runLoop)	 { return _prettyPrintRunLoopIdlingResource(runLoop); },
							CLS_STR(WXRNLoadIdlingResource)                   : ^ (id rnLoad)	 { return _prettyPrintRNLoadIdlingResource(rnLoad); },
							};
		
		WXFixupIdlingResourceClasses();
	});
}



- (NSDictionary*)currentStatus
{
	NSOrderedSet* busyResources = [[GREYUIThreadExecutor sharedInstance] grey_busyResources];
	
	if(busyResources.count == 0)
	{
		return @{@"state": @"idle"};
	}
	
	NSMutableDictionary* rv = [NSMutableDictionary new];
	rv[@"state"] = @"busy";
	
	NSMutableArray* resources = [NSMutableArray new];
	
	[busyResources enumerateObjectsUsingBlock:^(id<GREYIdlingResource>  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		NSString* prettyName = _prettyNames[CLS_STR(obj)] ?: obj.idlingResourceName;
		NSDictionary* (^prettyPrinter)(id<GREYIdlingResource>) = _prettyPrinters[CLS_STR(obj)] ?: ^ (id<GREYIdlingResource> res) { return @{}; };
		
		[resources addObject:@{@"name": prettyName, @"info": prettyPrinter(obj)}];
	}];
	
	rv[@"resources"] = resources;
	
	return rv;
}



+(instancetype)sharedInstance
{
	static EarlGreyStatistics* rv = nil;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		rv = [EarlGreyStatistics new];
	});
	return rv;
}

@end
