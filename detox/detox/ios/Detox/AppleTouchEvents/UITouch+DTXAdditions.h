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

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UITouch (DTXAdditions)

/**
 *  Creates a fake touch at @c point in window coordinates of the given @c window.
 *
 *  @param point  The location of this touch in window coordinates.
 *  @param window The reference window used for coordinates passed as @c point.
 *
 *  @return An initialized UITouch object
 */
- (id)initAtPoint:(CGPoint)point relativeToWindow:(UIWindow *)window;

@end

NS_ASSUME_NONNULL_END
