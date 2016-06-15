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

@interface GREYNot : GREYBaseMatcher

/**
 *  @remark init is not an available initializer. Use the other initializers.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 *  Initializes the finder with a given @c matcher.
 *
 *  @param matcher Matcher that defines the element whose negation is to be matched for.
 *
 *  @return An instance of GREYNot, initialized with a matcher.
 */
- (instancetype)initWithMatcher:(id<GREYMatcher>)matcher NS_DESIGNATED_INITIALIZER;

#if !(GREY_DISABLE_SHORTHAND)

/** Shorthand macro for GREYNot::initWithMatcher:. */
GREY_EXPORT id<GREYMatcher> grey_not(id<GREYMatcher> matcher);

#endif // GREY_DISABLE_SHORTHAND

@end
