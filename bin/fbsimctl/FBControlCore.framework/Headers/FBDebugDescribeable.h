/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

/**
 Defines a Full and Partial Description of the reciever
 Bridges to Swift's CustomDebugStringConvertible.
 */
@protocol FBDebugDescribeable

/**
 A Full Description of the reciever.
 */
@property (nonatomic, readonly, copy) NSString *debugDescription;

/**
 A Partial Description of the reciever.
 */
@property (nonatomic, readonly, copy) NSString *shortDescription;

@end
