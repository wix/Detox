//
//  GREYIdlingResourcePrettyPrint.m
//  Detox
//
//  Created by Leo Natan (Wix) on 20/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "GREYIdlingResourcePrettyPrint.h"

NSString* _prettyPrintAppState(GREYAppState state)
{
	NSMutableArray *eventStateString = [[NSMutableArray alloc] init];
	if (state == kGREYIdle) {
		return @"Idle";
	}
	
	if (state & kGREYPendingViewsToAppear)
	{
		[eventStateString addObject:@"Waiting for view controller's view to appear."];
	}
	if (state & kGREYPendingViewsToDisappear)
	{
		[eventStateString addObject:@"Waiting for view controller's view to disappear."];
	}
	if (state & kGREYPendingCAAnimation)
	{
		[eventStateString addObject:@"Waiting for an animation to finish. Continuous animations may never finish and must be stopped explicitly. Animations attached to hidden view may still be running in the background."];
	}
	if (state & kGREYPendingNetworkRequest)
	{
		[eventStateString addObject:@"Waiting for network requests to finish."];
	}
	if (state & kGREYPendingRootViewControllerToAppear)
	{
		[eventStateString addObject:@"Waiting for window's root view controller's view to appear."];
	}
	if (state & kGREYPendingGestureRecognition)
	{
		[eventStateString addObject:@"Waiting for gesture recognizer to detect or fail an ongoing gesture."];
	}
	if (state & kGREYPendingUIScrollViewScrolling)
	{
		[eventStateString addObject:@"Waiting for scroll view to finish scrolling and come to standstill."];
	}
	if (state & kGREYPendingUIWebViewAsyncRequest)
	{
		[eventStateString addObject:@"Waiting for web view to finish loading asynchronous request."];
	}
	if (state & kGREYPendingUIAnimation)
	{
		[eventStateString addObject:@"Waiting for animation to complete."];
	}
	if (state & kGREYIgnoringSystemWideUserInteraction)
	{
		[eventStateString addObject:@"System wide interaction events are being ignored."];
	}
	if (state & kGREYPendingKeyboardTransition)
	{
		[eventStateString addObject:@"Waiting for keyboard transition to finish."];
	}
	if (state & kGREYPendingDrawLayoutPass)
	{
		[eventStateString addObject:@"Waiting for view's draw or layout pass to complete."];
	}
	
	return [eventStateString componentsJoinedByString:@"\n"];
}

NSDictionary* _prettyPrintAppStateTracker(GREYAppStateTracker* tracker)
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	
	NSString* stateString = _prettyPrintAppState(tracker.currentState);
	rv[@"appState"] = stateString;
	
	
	NSHashTable* elements = [tracker valueForKey:@"elementIDs"];
	NSArray* allElements = [elements allObjects];
	
	NSMutableArray* elems = [NSMutableArray new];
	NSMutableArray* URLs = [NSMutableArray new];
	
	[allElements enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
		__unused NSString* aa = tracker.description;
		@try {
			[elems addObject:[obj debugDescription]];
		}
		@catch(NSException* exception) {} //NOOP
		
		@try {
			NSArray<NSString*>* strs = [obj componentsSeparatedByString:@":"];
			Class cls = NSClassFromString(strs.firstObject);
			
			if([cls isSubclassOfClass:[NSURLSessionTask class]])
			{
				NSScanner* hexScanner = [NSScanner scannerWithString:strs.lastObject];
				
				unsigned long long val;
				[hexScanner scanHexLongLong:&val];
				void* ptr = (void*)val;
				NSURLSessionTask* task = (__bridge id)ptr;
				[URLs addObject:task.originalRequest.URL.absoluteString];
			}
			
		} @catch (NSException *exception) {
			
		}
	}];
	
	if(elems.count > 0)
	{
		rv[@"elements"] = elems;
	}
	
	if(URLs.count > 0)
	{
		rv[@"urls"] = URLs;
		rv[@"prettyPrint"]  = [NSString stringWithFormat:@"%@: %@", stateString, URLs];
	}
	

	return rv;
}

NSDictionary* _prettyPrintDispatchQueueIdlingResource(GREYDispatchQueueIdlingResource* queue)
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	rv[@"queue"] = [queue valueForKeyPath:@"dispatchQueueTracker.dispatchQueue.debugDescription"];
	rv[@"prettyPrint"] = [[NSString alloc] initWithUTF8String:dispatch_queue_get_label([queue valueForKeyPath:@"dispatchQueueTracker.dispatchQueue"])];
	
	return rv;
}

NSDictionary* _prettyPrintManagedObjectContextIdlingResource(GREYManagedObjectContextIdlingResource* ctx)
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	rv[@"managedObjectContext"] = [[ctx valueForKeyPath:@"managedObjectContext"] debugDescription];
	rv[@"prettyPrint"] = [[ctx valueForKeyPath:@"managedObjectContext"] debugDescription];
	
	return rv;
}

NSDictionary* _prettyPrintTimerIdlingResource(GREYNSTimerIdlingResource* timer)
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	rv[@"timer"] = [[timer valueForKeyPath:@"trackedTimer"] debugDescription];
	rv[@"name"] = [timer valueForKeyPath:@"name"];
	rv[@"nextFireDate"] = [[timer valueForKeyPath:@"trackedTimer.fireDate"] descriptionWithLocale:[NSLocale currentLocale]];
	rv[@"prettyPrint"] = rv[@"name"];
	
	return rv;
}

NSDictionary* _prettyPrintOperationQueueIdlingResource(GREYOperationQueueIdlingResource* opQ)
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	rv[@"operationQueue"] = [[opQ valueForKeyPath:@"operationQueue"] debugDescription];
	rv[@"name"] = [opQ valueForKeyPath:@"operationQueueName"];
	rv[@"prettyPrint"] = rv[@"name"];
	
	return rv;
}

NSDictionary* _prettyPrintTimedIdlingResource(GREYTimedIdlingResource* timed)
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	rv[@"object"] = [[timed valueForKeyPath:@"trackedObject"] debugDescription];
	rv[@"name"] = [timed valueForKeyPath:@"name"];
	rv[@"duration"] = [timed valueForKeyPath:@"duration"];
	rv[@"endTrackingDate"] = [[NSDate dateWithTimeIntervalSince1970:[[timed valueForKeyPath:@"endTrackingTime"] doubleValue]] descriptionWithLocale:[NSLocale currentLocale]];
	rv[@"prettyPrint"] = rv[@"name"];
	
	return rv;
}

NSDictionary* _prettyPrintWebViewIdlingResource(id webview)
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	rv[@"webView"] = [[webview valueForKeyPath:@"webView"] debugDescription];
	rv[@"name"] = [webview valueForKeyPath:@"webViewName"];
	rv[@"prettyPrint"] = rv[@"name"];
	
	return rv;
}

NSDictionary* _prettyPrintJSTimerObservationIdlingResource(WXJSTimerObservationIdlingResource* jsTimer)
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	rv[@"javascriptTimerIDs"] = [[jsTimer valueForKeyPath:@"observations.objectEnumerator.allObjects.@distinctUnionOfArrays.observedTimers"] sortedArrayUsingSelector:@selector(compare:)];
	rv[@"prettyPrint"] = [NSString stringWithFormat:@"Javascript Timers Ids: %@", [rv[@"javascriptTimerIDs"] componentsJoinedByString:@", "]];	
	return rv;
}

NSDictionary* _prettyPrintRunLoopIdlingResource(WXRunLoopIdlingResource* runLoop)
{
	NSMutableDictionary* rv = [NSMutableDictionary new];
	rv[@"runLoop"] = [[runLoop valueForKeyPath:@"runLoop"] debugDescription];
	rv[@"prettyPrint"] = @"React Native thread is busy.";
	
	return rv;
}

