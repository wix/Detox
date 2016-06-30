/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <FBControlCore/FBJSONConversion.h>

NS_ASSUME_NONNULL_BEGIN

/**
 The UDID of the iOS Target.
 */
extern NSString *const FBiOSTargetFormatUDID;

/**
 The User-Provided Name of the Target.
 */
extern NSString *const FBiOSTargetFormatName;

/**
 The Apple Device Name.
 */
extern NSString *const FBiOSTargetFormatDeviceName;

/**
 The OS Version of the Target.
 */
extern NSString *const FBiOSTargetFormatOSVersion;

/**
 The State of the Target.
 */
extern NSString *const FBiOSTargetFormatState;

/**
 The Process Identifier of the Target where applicable.
 */
extern NSString *const FBiOSTargetFormatProcessIdentifier;

@protocol FBiOSTarget;

/**
 A Format Specifier for Describing an iOS Device/Simulator Target.
 */
@interface FBiOSTargetFormat : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBJSONDeserializable>

/**
 Creates and returns a new Target Format.

 @param fields the fields to describe with.
 @return a new Target Format.
 */
+ (instancetype)formatWithFields:(NSArray<NSString *> *)fields;

/**
 Creates and returns the Default Target Format.

 @return the Default Target Format.
 */
+ (instancetype)defaultFormat;

/**
 Creates and returns the Full Target Format.

 @return the Full Target Format.
 */
+ (instancetype)fullFormat;

/**
 An ordering of the fields to format targets with.
 */
@property (nonatomic, copy, readonly) NSArray<NSString *> *fields;

/**
 Returns a new Target Description by appending fields.

 @param fields the fields to append.
 @return a new Target Description with the fields applied.
 */
- (instancetype)appendFields:(NSArray<NSString *> *)fields;

/**
 Returns a new Target Description by appending a field.

 @param field the field to append.
 @return a new Target Description with the field applied.
 */
- (instancetype)appendField:(NSString *)field;

/**
 Describes the Target using the reciver's format.

 @param target the target to format.
 @return the format of the target.
 */
- (NSString *)format:(id<FBiOSTarget>)target;

/**
 Extracts target information into a JSON-Serializable Dictionary.

 @param target the target to format.
 @return the JSON-Serializable Description.
 */
- (NSDictionary<NSString *, id> *)extractFrom:(id<FBiOSTarget>)target;

@end

NS_ASSUME_NONNULL_END
