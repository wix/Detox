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

#import "Core/GREYElementFinder.h"

#import "Assertion/GREYAssertionDefines.h"
#import "Common/GREYDefines.h"
#import "Matcher/GREYMatcher.h"
#import "Provider/GREYProvider.h"

@implementation GREYElementFinder

- (instancetype)initWithMatcher:(id<GREYMatcher>)matcher {
  NSParameterAssert(matcher);

  self = [super init];
  if (self) {
    _matcher = matcher;
  }
  return self;
}

- (NSArray *)elementsMatchedInProvider:(id<GREYProvider>)elementProvider {
  NSParameterAssert(elementProvider);
  I_CHECK_MAIN_THREAD();

  NSMutableArray *matchingElements = [[NSMutableArray alloc] init];
  @autoreleasepool {
    for (id element in [elementProvider dataEnumerator]) {
      if ([_matcher matches:element]) {
        [matchingElements addObject:element];
      }
    }
  }
  return [NSArray arrayWithArray:matchingElements];
}

@end
