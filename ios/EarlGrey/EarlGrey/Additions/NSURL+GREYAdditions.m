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

#import "Additions/NSURL+GREYAdditions.h"

#import "Common/GREYConfiguration.h"

@implementation NSURL (GREYAdditions)

- (BOOL)grey_shouldSynchronize {
  NSString *regex = GREY_CONFIG_STRING(kGREYConfigKeyURLBlacklistRegex);
  if ([regex length] <= 0) {
    return YES;
  }
  static NSRegularExpression *cachedNetworkRegex;
  // Create a NSRegularExpression object if not already done so.
  if (cachedNetworkRegex == nil || ![cachedNetworkRegex.pattern isEqualToString:regex]) {
    NSError *error;
    cachedNetworkRegex = [NSRegularExpression regularExpressionWithPattern:regex
                                                                   options:0
                                                                     error:&error];
    NSAssert(!error, @"Invalid regex:\"%@\". See error: %@", regex, [error localizedDescription]);
  }
  NSString *stringURL = [self absoluteString];
  return [cachedNetworkRegex numberOfMatchesInString:stringURL
                                             options:0
                                               range:NSMakeRange(0, [stringURL length])] == 0;
}

@end
