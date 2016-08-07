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
 Protocol for denoting objects that are serializable with NSJSONSerialization.
 */
@protocol FBJSONSerializationDescribeable

/**
 Returns an NSJSONSerialization-compatible representation of the reciever.
 For more information about permitted types, refer the the NSJSONSerialization Documentation.

 @return an NSJSONSerialization-compatible representation of the reciever.
 */
- (id)jsonSerializableRepresentation;

@end
