/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol FBControlCoreLogger;
@protocol XCTestManager_IDEInterface;

/**
 Wraps implementors of XCTestManager_IDEInterface with logging.
 */
@interface FBXCTestManagerLoggingForwarder : NSObject

/**
 Constructs a Logging Forwarder, that will log all messages.

 @param interface the interface to wrap.
 @param logger the logger to log with.
 @return a new logging forwarder.
 */
+ (instancetype)withIDEInterface:(id<XCTestManager_IDEInterface, NSObject>)interface logger:(id<FBControlCoreLogger>)logger;

/**
 The Wrapped Interface.
 */
@property (nonatomic, weak, readonly) id<XCTestManager_IDEInterface, NSObject> interface;

/**
 The logger.
 */
@property (nonatomic, strong, readonly) id<FBControlCoreLogger> logger;

@end

NS_ASSUME_NONNULL_END
