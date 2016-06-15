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

#import <Foundation/Foundation.h>

/**
 *  Additions to NSError to facilitate error logging.
 */
@interface NSError (GREYAdditions)

/**
 *  If @c outErrorReferenceOrNil is provided it is set to an NSError object that is created with the
 *  given @c domain, @c code and description created from the given @c format and the args that
 *  follow. The description is accessible by querying error's @c userInfo with
 *  @c NSLocalizedDescriptionKey. If @c outErrorReferenceOrNil is not provided, the error
 *  information is logged to the console and @c NO is returned else @c YES is returned.
 *
 *  @param[out] outErrorReferenceOrNil An optional NSError reference for retrieving the created
 *                                     error object.
 *  @param      domain                 The error domain.
 *  @param      code                   The error code.
 *  @param      format                 The format of the error's localized description.
 *
 *  @return @c YES if error object was created and set, @c NO otherwise.
 */
+ (BOOL)grey_logOrSetOutReferenceIfNonNil:(__strong NSError **)outErrorReferenceOrNil
                               withDomain:(NSString *)domain
                                     code:(NSInteger)code
                     andDescriptionFormat:(NSString *)format, ... NS_FORMAT_FUNCTION(4, 5);

@end
