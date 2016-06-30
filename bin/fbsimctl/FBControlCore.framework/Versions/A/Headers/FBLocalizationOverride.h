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

/**
 Model Representing the Override of Language & Keyboard Settings.
 */
@interface FBLocalizationOverride : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBJSONDeserializable>

/**
 A Language Override with the given locale.

 @param locale the locale to override with.
 @return a new Language Override instance.
 */
+ (instancetype)withLocale:(NSLocale *)locale;

/**
 The Overrides for an NSUserDefaults dictionary.
 */
@property (nonatomic, copy, readonly) NSDictionary<NSString *, id> *defaultsDictionary;

/**
 Defaults Overrides passable as Arguments to an Application
 */
@property (nonatomic, copy, readonly) NSArray<NSString *> *arguments;

@end
