//
//  GREYIdlingResourcePrettyPrint.h
//  Detox
//
//  Created by Leo Natan (Wix) on 20/03/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "EarlGreyExtensions.h"
#import <EarlGrey/GREYAppStateTracker.h>
#import <EarlGrey/GREYDispatchQueueIdlingResource.h>
#import <EarlGrey/GREYManagedObjectContextIdlingResource.h>
#import <EarlGrey/GREYNSTimerIdlingResource.h>
#import <EarlGrey/GREYOperationQueueIdlingResource.h>
#import <EarlGrey/GREYTimedIdlingResource.h>
#import "WXJSTimerObservationIdlingResource.h"
#import "WXRunLoopIdlingResource.h"

extern NSDictionary* _prettyPrintAppStateTracker(GREYAppStateTracker* tracker);
extern NSDictionary* _prettyPrintDispatchQueueIdlingResource(GREYDispatchQueueIdlingResource* queue);
extern NSDictionary* _prettyPrintManagedObjectContextIdlingResource(GREYManagedObjectContextIdlingResource* ctx);
extern NSDictionary* _prettyPrintTimerIdlingResource(GREYNSTimerIdlingResource* timer);
extern NSDictionary* _prettyPrintOperationQueueIdlingResource(GREYOperationQueueIdlingResource* opQ);
extern NSDictionary* _prettyPrintTimedIdlingResource(GREYTimedIdlingResource* timed);
extern NSDictionary* _prettyPrintWebViewIdlingResource(id webview);
extern NSDictionary* _prettyPrintJSTimerObservationIdlingResource(WXJSTimerObservationIdlingResource* jsTimer);
extern NSDictionary* _prettyPrintRunLoopIdlingResource(WXRunLoopIdlingResource* runLoop);
