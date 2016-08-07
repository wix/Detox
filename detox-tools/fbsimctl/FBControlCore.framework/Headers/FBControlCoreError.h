/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

@class FBProcessFetcher;
@class FBSimulator;

@protocol FBControlCoreLogger;

/**
 The Error Domain for FBControlCore.
 */
extern NSString *const FBControlCoreErrorDomain;

/**
 Helpers for constructing Errors representing errors in FBControlCore & adding additional diagnosis.
 */
@interface FBControlCoreError : NSObject

/**
 Describes the build error using the description.
 */
+ (instancetype)describe:(NSString *)description;
- (instancetype)describe:(NSString *)description;
+ (instancetype)describeFormat:(NSString *)format, ... NS_FORMAT_FUNCTION(1,2);
- (instancetype)describeFormat:(NSString *)format, ... NS_FORMAT_FUNCTION(1,2);

/*
 Adds the Cause of the Error.
 */
+ (instancetype)causedBy:(NSError *)cause;
- (instancetype)causedBy:(NSError *)cause;

/**
 For returning early from failing conditions.
 */
- (BOOL)failBool:(NSError **)error;
- (unsigned int)failUInt:(NSError **)error;
- (CGRect)failRect:(NSError **)error;
- (id)fail:(NSError **)error;

/**
 Attach additional diagnostic information.
 */
- (instancetype)extraInfo:(NSString *)key value:(id)value;

/**
 Prints a recursive description in the error.
 */
- (instancetype)recursiveDescription;
- (instancetype)noRecursiveDescription;

/**
 Attaches Process Information to the error.

 @param processIdentifier the Process Identifier to find information for.
 @param processFetcher the Process Fetcher object to obtain process information from.
 @return the reciever, for chaining.
 */
- (instancetype)attachProcessInfoForIdentifier:(pid_t)processIdentifier processFetcher:(FBProcessFetcher *)processFetcher;

/**
 Attaches a Logger to the error.
 A logger will will recieve error messages for any errors that occur.
 By default this will be the Global Debug logger.
 Logging can be suppressed by providing a nil logger argument.

 @param logger the logger to log to
 @return the reciever, for chaining.
 */
- (instancetype)logger:(id<FBControlCoreLogger>)logger;

/**
 Updates the Error Domain of the reciever.

 @param domain the error domain to update with.
 @return the reciever, for chaining.
 */
- (instancetype)inDomain:(NSString *)domain;

/**
 Updates the Error Code of the reciever.

 @param code the Error Code to update with.
 @return the reciever, for chaining.
 */
- (instancetype)code:(NSInteger)code;

/**
 Builds the Error with the applied arguments.
 */
- (NSError *)build;

@end

@interface FBControlCoreError (Constructors)

/**
 Construct a simple error with the provided description.
 */
+ (NSError *)errorForDescription:(NSString *)description;

/**
 Return NO, wrapping `failureCause` in the FBControlCore domain.
 */
+ (BOOL)failBoolWithError:(NSError *)failureCause errorOut:(NSError **)errorOut;

/**
 Return NO, wraping wrapping `failureCause` in the FBControlCore domain with an additional description.
 */
+ (BOOL)failBoolWithError:(NSError *)failureCause description:(NSString *)description errorOut:(NSError **)errorOut;

/**
 Return NO with a simple failure message.
 */
+ (BOOL)failBoolWithErrorMessage:(NSString *)errorMessage errorOut:(NSError **)errorOut;

/**
 Return nil with a simple failure message.
 */
+ (id)failWithErrorMessage:(NSString *)errorMessage errorOut:(NSError **)errorOut;

/**
 Return nil, wrapping `failureCause` in the FBControlCore domain.
 */
+ (id)failWithError:(NSError *)failureCause errorOut:(NSError **)errorOut;

/**
 Return nil, wrapping `failureCause` in the FBControlCore domain with an additional description.
 */
+ (id)failWithError:(NSError *)failureCause description:(NSString *)description errorOut:(NSError **)errorOut;

@end
