//
//  DTXSyncManager.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/28/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

@class DTXSyncResource;

NS_ASSUME_NONNULL_BEGIN

/// A protocol that defines methods that sync manger system calls on its delegate to handle sync-related events, such as event tracking.
@protocol DTXSyncManagerDelegate <NSObject>

@optional

/// Tells the delegate that the sync system has become idle.
///
/// This method is called on the queue that triggers the idle state.
- (void)syncSystemDidBecomeIdle;
/// Tells the delegate that the sync system has become busy.
///
/// This method is called on the queue that triggers the busy state.
- (void)syncSystemDidBecomeBusy;


/// Tells the delegate that the sync system has started tracking an event.
///
/// This method is called on the queue that triggered the event.
///
/// @param identifier A unique identifier of the event
/// @param description A string description of the event
/// @param objectDescription An optional string description of the object triggering the event
/// @param additionalDescription An optional additional string description
- (void)syncSystemDidStartTrackingEventWithIdentifier:(NSString*)identifier description:(NSString*)description objectDescription:(nullable NSString*)objectDescription additionalDescription:(nullable NSString*)additionalDescription;
/// Tells the delegate that the sync system has finished tracking an event.
///
/// This method is called on the queue that triggered the event end.
///
/// @param identifier A unique identifier of the event
- (void)syncSystemDidEndTrackingEventWithIdentifier:(NSString*)identifier;

@end

/// A protocol represting a tracked event.
@protocol DTXTrackedEvent <NSObject>

/// Ends tracking of the current event. This method can be safely called from any queue.
- (void)endTracking;

@end

/// A class that allows tracking the idle status of the system.
__attribute__((weak_import))
@interface DTXSyncManager : NSObject

/// Enables or disables synchronization.
///
/// When synchronization is disabled, any enqueued idle block is executed immediately on submission.
@property (class, atomic) BOOL synchronizationDisabled;
/// Limits the maximum allowed delayed action tracking duration. Any delayed action with higher duration is ignored.
@property (class, atomic) NSTimeInterval maximumAllowedDelayedActionTrackingDuration;
/// Limits the maximum allowed timer tracking duration. Any timer with higher duration is ignored.
@property (class, atomic) NSTimeInterval maximumTimerIntervalTrackingDuration;
/// An array of strings representing URLs or URL regex matchers to disable tracking for.
@property (class, atomic, copy) NSArray<NSString*>* URLBlacklist NS_SWIFT_NAME(urlBlacklist);
/// Determines whether or not animations are modified. If @c true, then repeating animations are set to run only once and the animation duration is limited to a maximum of @c DTXSyncManager.maximumAnimationDuration. Enabled by default.
@property (class, atomic) BOOL modifyAnimations;
/// The maximum allowable animation duration for any CALayer based animation. Only in effect if @c DTXSyncManager.modifyAnimations is enabled. Default value is @c 1.0.
@property (class, atomic) NSTimeInterval maximumAnimationDuration;

/// The system delegate.
@property (class, nonatomic, weak) id<DTXSyncManagerDelegate> delegate;

/// Enqueues an idle block, to be called when the system becomes idle.
///
/// The block will be executed on the queue that triggers the idle state.
///
/// @param block The block to execute
+ (void)enqueueIdleBlock:(dispatch_block_t)block NS_SWIFT_NAME(enqueueIdleClosure(_:));
/// Enqueues an idle block, to be called on the main queue when the system becomes idle.
/// @param block The block to execute
+ (void)enqueueMainQueueIdleBlock:(dispatch_block_t)block NS_SWIFT_NAME(enqueueMainQueueIdleClosure(_:));
/// Enqueues an idle block, to be called on the specified queue when the system becomes idle.
/// @param block The block to execute
/// @param queue The queue to execute to idle block on
+ (void)enqueueIdleBlock:(dispatch_block_t)block queue:(nullable dispatch_queue_t)queue NS_SWIFT_NAME(enqueueIdleClosure(_:queue:));

/// Tracks a dispatch queue by the sync system.
///
/// The main queue is automatically tracked, and passing it to this method has no effect.
///
/// @param dispatchQueue The dispatch queue to track
/// @param name An optional name, used for reporting
+ (void)trackDispatchQueue:(dispatch_queue_t)dispatchQueue name:(nullable NSString*)name NS_SWIFT_NAME(track(dispatchQueue:name:));
/// Untracks a dispatch queue by the sync system.
///
/// The main queue is automatically tracked and cannot be untracked. Passing the main queue to this method has no effect.
///
/// @param dispatchQueue The dispatch queue to untrack
+ (void)untrackDispatchQueue:(dispatch_queue_t)dispatchQueue NS_SWIFT_NAME(untrack(dispatchQueue:));

/// Tracks a run loop by the sync system.
///
/// The main run loop is automatically tracked, and passing it to this method has no effect.
///
/// @param runLoop The run loop to track
/// @param name An optional name, used for reporting
+ (void)trackRunLoop:(NSRunLoop*)runLoop name:(nullable NSString*)name NS_SWIFT_NAME(track(runLoop:name:));
/// Untracks a run loop by the sync system.
///
/// The main run loop is automatically tracked and cannot be untracked. Passing the main run loop to this method has no effect.
///
/// @param runLoop The run loop to untrack
+ (void)untrackRunLoop:(NSRunLoop*)runLoop NS_SWIFT_NAME(untrack(runLoop:));
/// Tracks a run loop by the sync system.
///
/// The main run loop is automatically tracked, and passing it to this method has no effect.
///
/// @param runLoop The run loop to track
/// @param name An optional name, used for reporting
+ (void)trackCFRunLoop:(CFRunLoopRef)runLoop name:(nullable NSString*)name NS_SWIFT_NAME(track(cfRunLoop:name:));
/// Untracks a run loop by the sync system.
///
/// The main run loop is automatically tracked and cannot be untracked. Passing the main run loop to this method has no effect.
///
/// @param runLoop The run loop to untrack
+ (void)untrackCFRunLoop:(CFRunLoopRef)runLoop NS_SWIFT_NAME(untrack(cfRunLoop:));

/// Tracks a thread by the sync system.
///
/// The main thread is automatically tracked, and passing it to this method has no effect.
///
/// @param thread The thread to track
/// @param name An optional name, used for reporting
+ (void)trackThread:(NSThread*)thread name:(nullable NSString*)name NS_SWIFT_NAME(track(thread:name:));
/// Untracks a thread by the sync system.
///
/// The main thread is automatically tracked and cannot be untracked. Passing the main thread to this method has no effect.
///
/// @param thread The thread to untrack
+ (void)untrackThread:(NSThread*)thread NS_SWIFT_NAME(untrack(thread:));

/// Tracks a display link by the sync system.
/// @param displayLink The display link to track
/// @param name An optional name, used for reporting
+ (void)trackDisplayLink:(CADisplayLink*)displayLink name:(nullable NSString*)name NS_SWIFT_NAME(track(displayLink:name:));
/// Untracks a display link by the sync system
/// @param displayLink The display link to untrack
+ (void)untrackDisplayLink:(CADisplayLink*)displayLink;

/// Tracks an event by the sync system.
/// @param description A string description of the event
/// @param objectDescription An optional string description of the object triggering the event
+ (id<DTXTrackedEvent>)trackEventWithDescription:(NSString*)description objectDescription:(nullable NSString*)objectDescription NS_SWIFT_NAME(track(eventWithdescription:objectDescription:));

/// Block to call with a synchronization status to handle.
typedef void (^DTXStatusHandler)(NSDictionary<NSString *, id> *);

/// Queries the status of the sync system and calls the provided completion handler with the result.
///
/// @param completionHandler The completion handler to call with the synchronization status result.
///
/// @note The completion handler is called on a background queue.
/// @see https://github.com/wix/DetoxSync/blob/master/StatusDocumentation.md for more documentation.
+ (void)statusWithCompletionHandler:(DTXStatusHandler)completionHandler;

@end

NS_ASSUME_NONNULL_END
