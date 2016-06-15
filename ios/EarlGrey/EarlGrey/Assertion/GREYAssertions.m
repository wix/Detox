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

#import "Assertion/GREYAssertions.h"

#import "Assertion/GREYAssertion.h"
#import "Assertion/GREYAssertionBlock.h"
#import "Assertion/GREYAssertionDefines.h"
#import "Core/GREYInteraction.h"
#import "Matcher/GREYMatcher.h"
#import "Matcher/GREYMatchers.h"
#import "Matcher/GREYStringDescription.h"

@implementation GREYAssertions

#pragma mark - Private

+ (id<GREYAssertion>)grey_createAssertionWithMatcher:(id<GREYMatcher>)matcher {
  NSParameterAssert(matcher);

  NSString *assertionName = [NSString stringWithFormat:@"assertWithMatcher:%@", matcher];
  return [GREYAssertionBlock assertionWithName:assertionName
                       assertionBlockWithError:^BOOL (id element, NSError *__strong *errorOrNil) {
    GREYStringDescription *mismatch = [[GREYStringDescription alloc] init];
    if (![matcher matches:element describingMismatchTo:mismatch]) {
      NSMutableString *reason = [[NSMutableString alloc] init];
      if (!element) {
        [reason appendFormat:@"Element not found."];
        if (errorOrNil) {
          *errorOrNil = [NSError errorWithDomain:kGREYInteractionErrorDomain
                                            code:kGREYInteractionElementNotFoundErrorCode
                                        userInfo:nil];
        }
      } else {
        [reason appendFormat:@"UI element '%@' failed to match %@", element, mismatch];
        if (errorOrNil) {
          NSDictionary *userInfo = @{ NSLocalizedDescriptionKey : reason };
          *errorOrNil = [NSError errorWithDomain:kGREYInteractionErrorDomain
                                            code:kGREYInteractionAssertionFailedErrorCode
                                        userInfo:userInfo];
        }
      }
      // Log error if we are not populating errorOrNil.
      if (!errorOrNil) {
        NSLog(@"Assertion with matcher:%@ failed with error:%@", matcher, reason);
      }
      return NO;
    }
    return YES;
  }];
}

@end
