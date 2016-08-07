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

@class FBDiagnostic;
@class FBLogSearchPredicate;

NS_ASSUME_NONNULL_BEGIN

/**
 Defines a model for the result of a batch search on diagnostics.
 */
@interface FBBatchLogSearchResult : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBJSONDeserializable, FBDebugDescribeable>

/**
 The Results as a Mapping:
 The returned dictionary is a NSDictionary where:
 - The keys are the log names. A log must have 1 or more matches to have a key.
 - The values are an NSArrray of NSStrings for the lines that have been matched.
 */
@property (nonatomic, copy, readonly) NSDictionary<NSString *, NSArray<NSString *> *> *mapping;

/**
 Returns all matches from all elements in the mapping
 */
- (NSArray<NSString *> *)allMatches;

@end

/**
 Defines a model for batch searching diagnostics.
 This model is then used to concurrently search logs, returning the relevant matches.

 Diagnostics are defined in terms of thier short_name.
 Logs are defined in terms of Search Predicates.
 */
@interface FBBatchLogSearch : NSObject <NSCopying, NSCoding, FBJSONSerializable, FBJSONDeserializable, FBDebugDescribeable>

/**
 Constructs a Batch Log Search for the provided mapping of log names to predicates.
 The provided mapping is an NSDictionary where:
 - The keys are the names of the Diagnostics to search. The empty string matches against all input diagnostics.
 - The values are an NSArray of FBLogSearchPredicates of the predicates to search the the diagnostic with.

 @param mapping the mapping to search with.
 @param lines YES to include the full line in the output, NO for the matched substring.
 @param error an error out for any error in the mapping format.
 @return an FBBatchLogSearch instance if the mapping is valid, nil otherwise.
 */
+ (instancetype)withMapping:(NSDictionary<NSArray<NSString *> *, NSArray<FBLogSearchPredicate *> *> *)mapping lines:(BOOL)lines error:(NSError **)error;

/**
 Runs the Reciever over an array of Diagnostics.

 @param diagnostics an NSArray of FBDiagnostics to search.
 @return a search result
 */
- (FBBatchLogSearchResult *)search:(NSArray<FBDiagnostic *> *)diagnostics;

/**
 Convenience method for searching an array of diagnostics with a single predicate.

 @param diagnostics an NSArray of FBDiagnostics to search.
 @param predicate a Log Search Predicate to search with.
 @param lines YES to include the full line in the output, NO for the matched substring.
 @return a NSDictionary specified by -[FBBatchLogSearchResult mapping].
 */
+ (NSDictionary<NSString *, NSArray<NSString *> *> *)searchDiagnostics:(NSArray<FBDiagnostic *> *)diagnostics withPredicate:(FBLogSearchPredicate *)predicate lines:(BOOL)lines;

@end

NS_ASSUME_NONNULL_END
