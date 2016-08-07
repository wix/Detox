/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBSimulatorControl/FBInteraction.h>

/**
 Represents a Synchronous Action that can Succed or Fail.
 */
@protocol FBInteraction <NSObject>

/**
 Perform the given interaction.

 @param error an errorOut if any ocurred.
 @returns YES if the interaction succeeded, NO otherwise.
 */
- (BOOL)perform:(NSError **)error;

@end

/**
 A Concrete FBInteraction that can be subclassed to provide a chainable API.
 */
@interface FBInteraction : NSObject <FBInteraction, NSCopying>

#pragma mark Initializer

/**
 Creates a Subclassable Interaction

 @param interaction the underlying interaction.
 @return a subclassable FBInteraction Instance.
 */
- (instancetype)initWithInteraction:(id<FBInteraction>)interaction;

#pragma mark Properties

/**
 The Base Interaction.
 */
@property (nonatomic, strong, readonly) id<FBInteraction> interaction;

#pragma mark Chaining

/**
 Chains an interaction using the provided block.

 @param block the block to perform the interaction with. Passes an NSError to return error information and the Interaction Subclass for further chaining.
 @return the reciever, for chaining.
 */
- (instancetype)interact:(BOOL (^)(NSError **error, id interaction))block;

/**
 Chains an interaction that will allways succeed.

 @return the reciever, for chaining.
 */
- (instancetype)succeed;

/**
 Chains an interaction that will allways fail

 @return the reciever, for chaining.
 */
- (instancetype)fail:(NSError *)error;

@end
