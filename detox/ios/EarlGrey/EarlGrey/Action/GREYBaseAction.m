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
#import "Action/GREYBaseAction.h"

#import <OCHamcrest/OCHamcrest.h>

#import "Additions/NSError+GREYAdditions.h"
#import "Additions/NSObject+GREYAdditions.h"
#import "Assertion/GREYAssertionDefines.h"
#import "Common/GREYConfiguration.h"
#import "Core/GREYInteraction.h"
#import "Matcher/GREYMatcher.h"
#import "Matcher/GREYStringDescription.h"

@implementation GREYBaseAction {
  NSString *_name;
  id<GREYMatcher> _constraints;
}

- (instancetype)initWithName:(NSString *)name constraints:(id<GREYMatcher>)constraints {
  NSParameterAssert(name);

  self = [super init];
  if (self) {
    _name = [name copy];
    _constraints = constraints;
  }
  return self;
}

- (BOOL)satisfiesConstraintsForElement:(id)element error:(__strong NSError **)errorOrNilPtr {
  if (!_constraints || !GREY_CONFIG_BOOL(kGREYConfigKeyActionConstraintsEnabled)) {
    return YES;
  } else {
    GREYStringDescription *mismatchDetail = [[GREYStringDescription alloc] init];
    if (![_constraints matches:element describingMismatchTo:mismatchDetail]) {
      NSString *reason =
          [NSString stringWithFormat:@"Action could not be performed on "
                                     @"element '%@' because it failed constraints: %@",
                                     [element grey_description], mismatchDetail];
      NSString *details = [NSString stringWithFormat:@"All Constraints: %@", _constraints];
      if (errorOrNilPtr) {
        NSString *reasonAndDetails = [NSString stringWithFormat:@"%@\n%@", reason, details];
        NSDictionary *userInfo = @{ NSLocalizedDescriptionKey : reasonAndDetails };
        *errorOrNilPtr = [NSError errorWithDomain:kGREYInteractionErrorDomain
                                             code:kGREYInteractionActionFailedErrorCode
                                         userInfo:userInfo];
      } else {
        I_GREYActionFail(reason, details);
      }
      return NO;
    }
    return YES;
  }
}

#pragma mark - EGAction

// The perform:error: method has to be implemented by the subclass.
- (BOOL)perform:(id)element error:(__strong NSError **)errorOrNil {
  [self doesNotRecognizeSelector:_cmd];
  return NO;
}

- (NSString *)name {
  return _name;
}

@end
