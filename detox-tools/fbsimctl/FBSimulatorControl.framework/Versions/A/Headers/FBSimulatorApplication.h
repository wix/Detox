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
 Concrete value wrapper around a binary artifact.
 */
@interface FBSimulatorBinary : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBDebugDescribeable>

/**
 The Designated Initializer.

 @param name The name of the executable. Must not be nil.
 @param path The path to the executable. Must not be nil.
 @param architectures The supported architectures of the executable. Must not be nil.
 @returns a new FBSimulatorBinary instance.
 */
- (instancetype)initWithName:(NSString *)name path:(NSString *)path architectures:(NSSet *)architectures;

/**
 An initializer for FBSimulatorBinary that checks the nullability of the arguments

 @param name The name of the executable. May be nil.
 @param path The path to the executable. May be nil.
 @param architectures The supported architectures of the executable. Must not be nil.
 @returns a new FBSimulatorBinary instance, if all arguments are non-nil.
 */
+ (instancetype)withName:(NSString *)name path:(NSString *)path architectures:(NSSet *)architectures;

/**
 The Name of the Executable.
 */
@property (nonatomic, copy, readonly) NSString *name;

/**
 The File Path to the Executable.
 */
@property (nonatomic, copy, readonly) NSString *path;

/**
 The Supported Architectures of the Executable.
 */
@property (nonatomic, copy, readonly) NSSet *architectures;

@end

/**
 Concrete value wrapper around a Application artifact.
 */
@interface FBSimulatorApplication : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBDebugDescribeable>

/**
 The Designated Initializer.

 @param name the Name of the Application. See CFBundleName. Must not be nil.
 @param path The Path to the Application Bundle. Must not be nil.
 @param bundleID the Bundle ID of the Application. Must not be nil.
 @param binary the Path to the binary inside the Application. Must not be nil.
 @returns a new FBSimulatorApplication instance.
 */
- (instancetype)initWithName:(NSString *)name path:(NSString *)path bundleID:(NSString *)bundleID binary:(FBSimulatorBinary *)binary;

/**
 An initializer for FBSimulatorApplication that checks the nullability of the arguments

 @param name the Name of the Application. See CFBundleName. Must not be nil.
 @param path The Path to the Application Bundle. May be nil.
 @param bundleID the Bundle ID of the Application. May be nil.
 @param binary the Path to the binary inside the Application. May be nil.
 @returns a new FBSimulatorApplication instance, if all arguments are non-nil.
 */
+ (instancetype)withName:(NSString *)name path:(NSString *)path bundleID:(NSString *)bundleID binary:(FBSimulatorBinary *)binary;

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
@property (nonatomic, copy, readonly) FBSimulatorBinary *binary;

@end

/**
 Conveniences for building FBSimulatorApplication instances.
 */
@interface FBSimulatorApplication (Helpers)

/**
 Constructs a FBSimulatorApplication for the Application at the given path.

 @param path the path of the applocation to construct.
 @param error an error out.
 @returns a FBSimulatorApplication instance if one could be constructed, nil otherwise.
 */
+ (instancetype)applicationWithPath:(NSString *)path error:(NSError **)error;

/**
 Returns the FBSimulatorApplication for the current version of Xcode's Simulator.app.
 Will assert if the FBSimulatorApplication instance could not be constructed.

 @return A FBSimulatorApplication instance for the Simulator.app.
 */
+ (instancetype)xcodeSimulator;

/**
 Returns the System Application with the provided name.

 @param appName the System Application to fetch.
 @param error any error that occurred in fetching the application.
 @returns FBSimulatorApplication instance if one could for the given name could be found, nil otherwise.
 */
+ (instancetype)systemApplicationNamed:(NSString *)appName error:(NSError **)error;

@end

/**
 Conveniences for building FBSimulatorBinary instances
 */
@interface FBSimulatorBinary (Helpers)

/**
 Returns the FBSimulatorBinary for the given binary path
 */
+ (instancetype)binaryWithPath:(NSString *)path error:(NSError **)error;

/**
 Returns the launchctl for the current version of Xcode's of the Simulator Platform.
 Will assert if the FBSimulatorBinary instance could not be constructed.

 @return a FBSimulatorBinary instance launchctl.
 */
+ (instancetype)launchCtl;

@end
