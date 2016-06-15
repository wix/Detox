//
// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import <EarlGrey/GREYBaseMatcher.h>
#import <EarlGrey/GREYDefines.h>
#import <Foundation/Foundation.h>

/**
 *  Matcher for combining multiple matchers with a logical @c OR operator, so that a match occurs
 *  when any of the matchers match the element. The invocation of the matchers is in the same
 *  order in which they are passed. As soon as one of the matchers succeeds, the rest are
 *  not invoked.
 */
@interface GREYAnyOf : GREYBaseMatcher

/**
 *  @remark init is not an available initializer. Use the other initializers.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 *  Designated initializer to add all the matchers to be checked.
 *
 *  @param matchers The matchers, one of which is required to be matched by the matcher.
 *                  They are invoked in the order that they are passed in.
 *
 *  @return An instance of GREYAnyOf, initialized with the provided matcher(s).
 */
- (instancetype)initWithMatchers:(NSArray *)matchers NS_DESIGNATED_INITIALIZER;

#if !(GREY_DISABLE_SHORTHAND)

/**
 *  A matcher that is a logical OR of all the matchers passed in as variable arguments.
 *
 *  @param match The first matcher in the list of matchers.
 *  @param ...   Any more matchers to be added. Matchers are invoked in the order they are
 *               specified and only if the preceding matcher fails.
 *               This va-arg must be terminated with a @c nil value.
 *
 *  @return An object conforming to HCMatcher, initialized with the required matcher(s).
 */
GREY_EXPORT id<GREYMatcher> grey_anyOf(id<GREYMatcher> match, ...) NS_REQUIRES_NIL_TERMINATION;

#endif // GREY_DISABLE_SHORTHAND

@end
