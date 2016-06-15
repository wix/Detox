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

#import "Additions/NSError+GREYAdditions.h"

@implementation NSError (GREYAdditions)

+ (BOOL)grey_logOrSetOutReferenceIfNonNil:(__strong NSError **)outErrorReferenceOrNil
                               withDomain:(NSString *)domain
                                     code:(NSInteger)code
                     andDescriptionFormat:(NSString *)format, ... {
  va_list args;
  va_start(args, format);
  NSString *description = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
  if (outErrorReferenceOrNil) {
    NSDictionary *userInfo = @{ NSLocalizedDescriptionKey : description };
    *outErrorReferenceOrNil = [NSError errorWithDomain:domain code:code userInfo:userInfo];
    return YES;
  } else {
    NSLog(@"Error (domain: %@, code: %ld): %@", domain, (long)code, description);
    return NO;
  }
}

@end
