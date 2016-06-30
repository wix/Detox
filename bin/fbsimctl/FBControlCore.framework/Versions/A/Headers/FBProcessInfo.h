/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBDebugDescribeable.h>
#import <FBControlCore/FBJSONConversion.h>

@class FBProcessLaunchConfiguration;

/**
 Concrete Value of Process Information.
 */
@interface FBProcessInfo : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBDebugDescribeable>

/**
 The Designated Initializer.

 @param processIdentifier the process identifer.
 @param launchPath the path of the binary that the process was launched with.
 @param arguments the arguments that the process was launched with.
 @param environment the environment that the
 */
- (instancetype)initWithProcessIdentifier:(pid_t)processIdentifier launchPath:(NSString *)launchPath arguments:(NSArray *)arguments environment:(NSDictionary *)environment;

/**
 The Process Identifier for the running process
 */
@property (nonatomic, assign, readonly) pid_t processIdentifier;

/**
 The Name of the Process.
 */
@property (nonatomic, copy, readonly) NSString *processName;

/**
 The Launch Path of the running process
 */
@property (nonatomic, copy, readonly) NSString *launchPath;

/**
 An NSArray<NSString *> of the launch arguments of the process.
 */
@property (nonatomic, copy, readonly) NSArray<NSString *> *arguments;

/**
 An NSDictionary<NSString *, NSString *> of the environment of the process.
 */
@property (nonatomic, copy, readonly) NSDictionary<NSString *, NSString *> *environment;

@end
