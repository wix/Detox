//
// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import <UIKit/UIKit.h>

/**
 *  State for touch injector.
 */
typedef NS_ENUM(NSInteger, GREYTouchInjectorState){
  /**
   *  Touch injection hasn't started yet.
   */
  kGREYTouchInjectorPendingStart,
  /**
   *  Injection has started injecting touches.
   */
  kGREYTouchInjectorStarted,
  /**
   *  Touch injection has stopped. This state is reached when injector has
   *  finished injecting all the queued touches.
   */
  kGREYTouchInjectorStopped,
};

/**
 *  Class that encapsulates essential information about a touch.
 */
@interface GREYTouchInfo : NSObject

/**
 *  Point where touch should be delivered.
 */
@property(nonatomic, readonly) CGPoint point;
/**
 *  Set to @c YES if this is the last touch in the sequence of touches.
 */
@property(nonatomic, readonly, getter=isLastTouch) BOOL lastTouch;
/**
 *  Delays this touch for specified value since the last touch delivery.
 */
@property(nonatomic, readonly) NSTimeInterval deliveryTimeDeltaSinceLastTouch;
/**
 *  Indicates that this touch can be dropped if system delivering the touches experiences a
 *  lag causing it to miss the expected delivery time.
 */
@property(nonatomic, readonly, getter=isExpendable) BOOL expendable;

/**
 *  @remark init is not an available initializer. Use the other initializers.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 *  Initializes this object to represent a touch.
 *
 *  @param point                          The CGPoint where the touch is to be delivered.
 *  @param isLastTouch                    Specifies if this is a last touch object
 *                                        (that represents a 'touch-up')
 *  @param timeDeltaSinceLastTouchSeconds The relative injection time from the time last
 *                                        touch point was injected. It is also used as the
 *                                        expected delivery time.
 *  @param expendable                     Used for time sensitive touches, it specified if the
 *                                        touch can be dropped if system lag causes the system to
 *                                        miss the expected delivery time. If @c NO, then the touch
 *                                        will be delivered regardless.
 *
 *  @return An instance of GREYSingleSequenceTouchInjector, initialized with all required data.
 */
- (instancetype)initWithPoint:(CGPoint)point
                            lastTouch:(BOOL)isLastTouch
      deliveryTimeDeltaSinceLastTouch:(NSTimeInterval)timeDeltaSinceLastTouchSeconds
                           expendable:(BOOL)expendable NS_DESIGNATED_INITIALIZER;

@end

/**
 *  A touch injector that delivers a complete touch sequence for single finger interactions.
 *  Buffers all touch events until @c startInjecting: is called.
 *  Once injection is complete, this injector should be discarded.
 */
@interface GREYSingleSequenceTouchInjector : NSObject

/**
 *  @remark init is not an available initializer. Use the other initializers.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 *  Initializes with the @c window to which touches will be delivered.
 *
 *  @param window The window that receives the touches.
 *
 *  @return An instance of GREYSingleSequenceTouchInjector, initialized with the window to be
 *          touched.
 */
- (instancetype)initWithWindow:(UIWindow *)window NS_DESIGNATED_INITIALIZER;

/**
 *  Enqueues @c touchInfo that will be materialized into a UITouch and delivered to application.
 *
 *  @param touchInfo The info that is used to create the UITouch. If it represents a last touch
 *                   in a sequence, the specified @c point value is ignored and injector
 *                   automatically picks the previous point where touch occured to deliver
 *                   the last touch.
 */
- (void)enqueueTouchInfoForDelivery:(GREYTouchInfo *)touchInfo;

/**
 *  Starts delivering touches to the current application.
 */
- (void)startInjecting;

/**
 *  @return The state of this injector.
 */
- (GREYTouchInjectorState)state;

@end
