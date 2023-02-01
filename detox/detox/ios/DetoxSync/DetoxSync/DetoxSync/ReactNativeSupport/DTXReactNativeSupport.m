//
//  DTXReactNativeSupport.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/14/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXReactNativeSupport.h"
#import "ReactNativeHeaders.h"
#import "DTXSyncManager-Private.h"
#import "DTXJSTimerSyncResource.h"
#import "DTXSingleEventSyncResource.h"
#import "fishhook.h"
#import <dlfcn.h>
#import <stdatomic.h>

@import UIKit;
@import ObjectiveC;
@import Darwin;

DTX_CREATE_LOG(DTXSyncReactNativeSupport);

@interface DTXReactNativeSupport ()

+ (void)cleanupBeforeReload;

@end

atomic_cfrunloop __RNRunLoop;
static atomic_constvoidptr __RNThread;
static void (*orig_runRunLoopThread)(id, SEL) = NULL;
static void swz_runRunLoopThread(id self, SEL _cmd)
{
  CFRunLoopRef oldRunloop = atomic_load(&__RNRunLoop);
  NSThread* oldThread = CFBridgingRelease(atomic_load(&__RNThread));
  [DTXSyncManager untrackThread:oldThread];
  [DTXSyncManager untrackCFRunLoop:oldRunloop];

  CFRunLoopRef current = CFRunLoopGetCurrent();
  atomic_store(&__RNRunLoop, current);

  atomic_store(&__RNThread, CFBridgingRetain([NSThread currentThread]));

  [DTXSyncManager trackThread:[NSThread currentThread] name:@"JavaScript Thread"];
  [DTXSyncManager trackCFRunLoop:current name:@"JavaScript RunLoop"];


  oldThread = nil;

  orig_runRunLoopThread(self, _cmd);
}

static NSMutableArray* _observedQueues;

static int (*__orig__UIApplication_run_orig)(id self, SEL _cmd);
static int __detox_sync_UIApplication_run(id self, SEL _cmd)
{
  Class cls = NSClassFromString(@"RCTJSCExecutor");
  Method m = NULL;
  if(cls != NULL)
    {
    //Legacy RN
    m = class_getClassMethod(cls, NSSelectorFromString(@"runRunLoopThread"));
    dtx_log_info(@"Found legacy class RCTJSCExecutor");
    }
  else
    {
    //Modern RN
    cls = NSClassFromString(@"RCTCxxBridge");
    m = class_getClassMethod(cls, NSSelectorFromString(@"runRunLoop"));
    if(m == NULL)
      {
      m = class_getInstanceMethod(cls, NSSelectorFromString(@"runJSRunLoop"));
      dtx_log_info(@"Found modern class RCTCxxBridge, method runJSRunLoop");
      }
    else
      {
      dtx_log_info(@"Found modern class RCTCxxBridge, method runRunLoop");
      }
    }

  if(m != NULL)
    {
    orig_runRunLoopThread = (void(*)(id, SEL))method_getImplementation(m);
    method_setImplementation(m, (IMP)swz_runRunLoopThread);
    }
  else
    {
    dtx_log_info(@"Method runRunLoop not found");
    }

  return __orig__UIApplication_run_orig(self, _cmd);
}

typedef void (^RCTSourceLoadBlock)(NSError *error, id source);

static void (*__orig_loadBundleAtURL_onProgress_onComplete)(id self, SEL _cmd, NSURL* url, id onProgress, RCTSourceLoadBlock onComplete);
static void __detox_sync_loadBundleAtURL_onProgress_onComplete(id self, SEL _cmd, NSURL* url, id onProgress, RCTSourceLoadBlock onComplete)
{
  [DTXReactNativeSupport cleanupBeforeReload];

  dtx_log_info(@"Adding idling resource for RN load");

  id<DTXSingleEvent> sr = [DTXSingleEventSyncResource singleUseSyncResourceWithObjectDescription:nil eventDescription:@"React Native (bundle load)"];

  [DTXReactNativeSupport waitForReactNativeLoadWithCompletionHandler:^{
    [sr endTracking];
  }];

  __orig_loadBundleAtURL_onProgress_onComplete(self, _cmd, url, onProgress, onComplete);
}

static void _DTXTrackUIManagerQueue(void)
{
  //Cannot just extern this function - we are not linked with RN, so linker will fail. Instead, look for symbol in runtime.
  dispatch_queue_t (*RCTGetUIManagerQueue)(void) = dlsym(RTLD_DEFAULT, "RCTGetUIManagerQueue");

  //Must be performed in +load and not in +setUp in order to correctly catch the ui queue, runloop and display link initialization by RN.
  dispatch_queue_t queue = RCTGetUIManagerQueue();
  NSString* queueName = [[NSString alloc] initWithUTF8String:dispatch_queue_get_label(queue) ?: queue.description.UTF8String];
  DTXSyncResourceVerboseLog(@"Adding sync resource for RCTUIManagerQueue: %@ %p", queueName, queue);
  [_observedQueues addObject:queue];
  [DTXSyncManager trackDispatchQueue:queue name:@"RN Module: UIManager"];
}

__attribute__((constructor))
static void _setupRNSupport()
{
  @autoreleasepool
  {
  Class cls = NSClassFromString(@"RCTModuleData");
  if(cls == nil)
    {
    return;
    }

  _observedQueues = [NSMutableArray new];

  //Add an idling resource for each module queue.
  Method m = class_getInstanceMethod(cls, NSSelectorFromString(@"setUpMethodQueue"));
  void(*orig_setUpMethodQueue_imp)(id, SEL) = (void(*)(id, SEL))method_getImplementation(m);
  method_setImplementation(m, imp_implementationWithBlock(^(id _self) {
    orig_setUpMethodQueue_imp(_self, NSSelectorFromString(@"setUpMethodQueue"));

    dispatch_queue_t queue = object_getIvar(_self, class_getInstanceVariable(cls, "_methodQueue"));

    if(queue != nil && [queue isKindOfClass:NSNull.class] == NO && queue != dispatch_get_main_queue() && [_observedQueues containsObject:queue] == NO)
      {
      NSString* queueName = [[NSString alloc] initWithUTF8String:dispatch_queue_get_label(queue) ?: queue.description.UTF8String];

      [_observedQueues addObject:queue];

      DTXSyncResourceVerboseLog(@"Adding sync resource for queue: %@ %p", queueName, queue);

      NSString* moduleName = [_self valueForKey:@"name"];
      if(moduleName.length == 0)
        {
        moduleName = [_self description];
        }

      [DTXSyncManager trackDispatchQueue:queue name:[NSString stringWithFormat:@"RN Module: %@", moduleName]];
      }
  }));

  _DTXTrackUIManagerQueue();

  m = class_getInstanceMethod(UIApplication.class, NSSelectorFromString(@"_run"));
  __orig__UIApplication_run_orig = (void*)method_getImplementation(m);
  method_setImplementation(m, (void*)__detox_sync_UIApplication_run);

  DTXSyncResourceVerboseLog(@"Adding sync resource for JS timers");

  DTXJSTimerSyncResource* sr = [DTXJSTimerSyncResource new];
  [DTXSyncManager registerSyncResource:sr];

  cls = NSClassFromString(@"RCTJavaScriptLoader");
  if(cls == nil)
    {
    return;
    }

  m = class_getClassMethod(cls, NSSelectorFromString(@"loadBundleAtURL:onProgress:onComplete:"));
  if(m == NULL)
    {
    return;
    }
  __orig_loadBundleAtURL_onProgress_onComplete = (void*)method_getImplementation(m);
  method_setImplementation(m, (void*)__detox_sync_loadBundleAtURL_onProgress_onComplete);

  // Disables `FLEXNetworkObserver` (or `SKFLEXNetworkObserver` as renamed in Flipper version
  // 0.142), due to buggy swizzling.
  cls = NSClassFromString(@"FLEXNetworkObserver") ?: NSClassFromString(@"SKFLEXNetworkObserver");
  if(cls != nil)
    {
    m = class_getClassMethod(cls, NSSelectorFromString(@"injectIntoAllNSURLConnectionDelegateClasses"));
    method_setImplementation(m, imp_implementationWithBlock(^(id _self) {
      NSLog(@"%@ has been disabled by DetoxSync", NSStringFromClass(cls));
    }));
    }
  }
}

@implementation DTXReactNativeSupport

+ (BOOL)hasReactNative
{
  return (NSClassFromString(@"RCTBridge") != nil);
}

+ (void)waitForReactNativeLoadWithCompletionHandler:(void (^)(void))handler
{
  NSParameterAssert(handler != nil);

  __block __weak id observer;
  __block __weak id observer2;

  observer = [[NSNotificationCenter defaultCenter] addObserverForName:@"RCTJavaScriptDidLoadNotification" object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
    [[NSNotificationCenter defaultCenter] removeObserver:observer];
    [[NSNotificationCenter defaultCenter] removeObserver:observer2];

    observer = [[NSNotificationCenter defaultCenter] addObserverForName:@"RCTContentDidAppearNotification" object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
      [[NSNotificationCenter defaultCenter] removeObserver:observer];

      handler();
    }];
  }];

  observer2 = [[NSNotificationCenter defaultCenter] addObserverForName:@"RCTJavaScriptDidFailToLoadNotification" object:nil queue:nil usingBlock:^(NSNotification * _Nonnull note) {
    [[NSNotificationCenter defaultCenter] removeObserver:observer];
    [[NSNotificationCenter defaultCenter] removeObserver:observer2];

    handler();
  }];
}

+ (void)cleanupBeforeReload
{
  dtx_log_info(@"Cleaning idling resource before RN load");

  for (dispatch_queue_t queue in _observedQueues) {
    NSString* queueName = [[NSString alloc] initWithUTF8String:dispatch_queue_get_label(queue) ?: queue.description.UTF8String];
    DTXSyncResourceVerboseLog(@"Remobing sync resource for queue: %@ %p", queueName, queue);
    [DTXSyncManager untrackDispatchQueue:queue];
  }

  [_observedQueues removeAllObjects];

  // Adding delay before re-tracking so the resource dealloc won't trigger unregisteration (preventing race condition)
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 100 * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
    _DTXTrackUIManagerQueue();
  });
}

@end
