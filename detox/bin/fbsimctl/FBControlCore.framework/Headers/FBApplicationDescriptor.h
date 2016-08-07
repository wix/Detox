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
#import <FBControlCore/FBDebugDescribeable.h>

NS_ASSUME_NONNULL_BEGIN

@class FBBinaryDescriptor;

/**
 Concrete value wrapper around a Application artifact.
 */
@interface FBApplicationDescriptor : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBDebugDescribeable>

/**
 The Designated Initializer.

 @param name the Name of the Application. See CFBundleName. Must not be nil.
 @param path The Path to the Application Bundle. Must not be nil.
 @param bundleID the Bundle ID of the Application. Must not be nil.
 @param binary the Path to the binary inside the Application. Must not be nil.
 @returns a new FBApplicationDescriptor instance.
 */
- (instancetype)initWithName:(NSString *)name path:(NSString *)path bundleID:(NSString *)bundleID binary:(FBBinaryDescriptor *)binary;

/**
 An initializer for FBApplicationDescriptor that checks the nullability of the arguments

 @param name the Name of the Application. See CFBundleName. Must not be nil.
 @param path The Path to the Application Bundle. May be nil.
 @param bundleID the Bundle ID of the Application. May be nil.
 @param binary the Path to the binary inside the Application. May be nil.
 @returns a new FBApplicationDescriptor instance, if all arguments are non-nil. Nil otherwise
 */
+ (nullable instancetype)withName:(NSString *)name path:(NSString *)path bundleID:(NSString *)bundleID binary:(FBBinaryDescriptor *)binary;

/**
 The name of the Application. See CFBundleName.
 */
@property (nonatomic, copy, readonly) NSString *name;

/**
 The File Path to the Application.
 */
@property (nonatomic, copy, readonly) NSString *path;

/**
 The Bundle Identifier of the Application. See CFBundleIdentifier.
 */
@property (nonatomic, copy, readonly) NSString *bundleID;

/**
 The Executable Binary contained within the Application's Bundle.
 */
@property (nonatomic, copy, readonly) FBBinaryDescriptor *binary;

@end

/**
 Conveniences for building FBApplicationDescriptor instances.
 */
@interface FBApplicationDescriptor (Helpers)

/**
 Constructs a FBApplicationDescriptor for the Application at the given path.

 @param path the path of the applocation to construct.
 @param error an error out.
 @returns a FBApplicationDescriptor instance if one could be constructed, nil otherwise.
 */
+ (nullable instancetype)applicationWithPath:(NSString *)path error:(NSError **)error;

/**
 Returns the FBApplicationDescriptor for the current version of Xcode's Simulator.app.
 Will assert if the FBApplicationDescriptor instance could not be constructed.

 @return A FBApplicationDescriptor instance for the Simulator.app.
 */
+ (instancetype)xcodeSimulator;

/**
 Returns the System Application with the provided name.

 @param appName the System Application to fetch.
 @param error any error that occurred in fetching the application.
 @returns FBApplicationDescriptor instance if one could for the given name could be found, nil otherwise.
 */
+ (nullable instancetype)systemApplicationNamed:(NSString *)appName error:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
