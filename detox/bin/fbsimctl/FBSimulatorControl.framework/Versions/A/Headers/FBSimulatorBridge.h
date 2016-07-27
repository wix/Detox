/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBControlCore.h>

@class FBFramebuffer;
@class FBSimulator;
@class FBSimulatorLaunchConfiguration;
@protocol SimulatorBridge;
@protocol FBSimulatorEventSink;
@class FBApplicationLaunchConfiguration;

NS_ASSUME_NONNULL_BEGIN

/**
 A Simulator Bridge is a container for all of the relevant services that can be obtained when launching via: -[SimDevice bootWithOptions:error].
 Typically these are all the services with which Simulator.app can interact with, except that we have them inside FBSimulatorControl.
 */
@interface FBSimulatorBridge : NSObject  <FBJSONSerializable>

#pragma mark Initializers

/**
 The Designated Initializer

 @param framebuffer the Framebuffer. May be nil.
 @param hidPort the Indigo HID Port. Zero if no such port exists.
 @param bridge the underlying bridge. Must not be nil.
 @param eventSink the event sink. Must not be nil.
 */
- (instancetype)initWithFramebuffer:(nullable FBFramebuffer *)framebuffer hidPort:(mach_port_t)hidPort bridge:(id<SimulatorBridge>)bridge eventSink:(id<FBSimulatorEventSink>)eventSink;

/**
 Tears down the bridge and it's resources, waiting for any asynchronous teardown to occur before returning.
 Must only ever be called from the main thread.

 @param timeout the number of seconds to wait for termination to occur in. If 0 or fewer, the reciever won't wait.
 @return YES if the termination occurred within timeout seconds, NO otherwise.
 */
- (BOOL)terminateWithTimeout:(NSTimeInterval)timeout;

#pragma mark Interacting with the Simulator

/**
 Sets latitude and longitude of the Simulator.
 The behaviour of a directly-launched Simulator differs from Simulator.app slightly, in that the location isn't automatically set.
 Simulator.app will typically set a location from NSUserDefaults, so Applications will have a default location.

 @param latitude the latitude of the location.
 @param longitude the longitude of the location.
 */
- (void)setLocationWithLatitude:(double)latitude longitude:(double)longitude;

/**
 Performs a Tap (Press) of any element that can be found at this location.
 Will fail if an element could not be found or tapped.

 @param x the X Coordinate of the Element to Tap.
 @param y the Y Coordinate of the Element to Tap.
 @param error an error out for any error that occurs.
 */
- (BOOL)tapX:(double)x y:(double)y error:(NSError **)error;

/**
 Launches an Application.

 @param configuration the Configuration of the App to Launch,
 @param stdOutPath the Path of a File to write stdout to.
 @param stdErrPath the path of a File to write stderr to.
 @return the Process Identifeir of the Launched Application if successful, -1 otherwise.
 */
- (pid_t)launch:(FBApplicationLaunchConfiguration *)configuration stdOutPath:(nullable NSString *)stdOutPath stdErrPath:(nullable NSString *)stdErrPath error:(NSError **)error;

#pragma mark Properties

/**
 The FBSimulatorFramebuffer Instance.
 */
@property (nonatomic, strong, readonly, nullable) FBFramebuffer *framebuffer;

@end

NS_ASSUME_NONNULL_END
