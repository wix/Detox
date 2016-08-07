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

@class FBApplicationLaunchConfiguration;
@class FBFramebuffer;
@class FBSimulator;
@class FBSimulatorBridge;
@class FBSimulatorHID;
@class FBSimulatorLaunchConfiguration;

NS_ASSUME_NONNULL_BEGIN

/**
 A Simulator Connection is a container for all of the relevant services that can be obtained when launching via: -[SimDevice bootWithOptions:error].
 Typically these are all the services with which Simulator.app can interact with, except that we have them inside FBSimulatorControl.

 The Constructor takes arguments that are a product of the booting process. These arguments *must* be provided when the connection is established.
 These arguments can be nil, but will not change during the lifetime of a connection.
 The 'Simulator Bridge' connection can be established lazily, that is to say the Bridge Connection can be made *after* the connection is created.
 */
@interface FBSimulatorConnection : NSObject  <FBJSONSerializable>

#pragma mark Initializers

/**
 The Designated Initializer.

 @param simulator the Simulator to Connect to.
 @param framebuffer the Framebuffer. May be nil.
 @param hid the Indigo HID Port. May be nil.
 */
- (instancetype)initWithSimulator:(FBSimulator *)simulator framebuffer:(nullable FBFramebuffer *)framebuffer hid:(nullable FBSimulatorHID *)hid;

/**
 Tears down the bridge and it's resources, waiting for any asynchronous teardown to occur before returning.
 Must only ever be called from the main thread.

 @param timeout the number of seconds to wait for termination to occur in. If 0 or fewer, the reciever won't wait.
 @return YES if the termination occurred within timeout seconds, NO otherwise.
 */
- (BOOL)terminateWithTimeout:(NSTimeInterval)timeout;

/**
 Connects to the SimulatorBridge.
 */
- (nullable FBSimulatorBridge *)connectToBridge:(NSError **)error;

#pragma mark Properties

/**
 The FBSimulatorFramebuffer owned by the reciever.
 */
@property (nonatomic, strong, readonly, nullable) FBFramebuffer *framebuffer;

/**
 The FBSimulatorHID owned by the reciever.
 */
@property (nonatomic, strong, readonly, nullable) FBSimulatorHID *hid;

@end

NS_ASSUME_NONNULL_END
