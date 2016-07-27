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

#import "Delegate/GREYCAAnimationDelegate.h"

#import "Additions/CAAnimation+GREYAdditions.h"
#import "Common/GREYDefines.h"

@implementation GREYCAAnimationDelegate

- (instancetype)initWithOriginalCAAnimationDelegate:(id)originalDelegate {
  return [super initWithOriginalDelegate:originalDelegate isWeak:NO];
}

- (void)animationDidStart:(CAAnimation *)animation {
  [animation grey_setAnimationState:kGREYAnimationStarted];

  if ([self.originalDelegate respondsToSelector:_cmd]) {
    [self.originalDelegate animationDidStart:animation];
  }
}

- (void)animationDidStop:(CAAnimation *)animation finished:(BOOL)finished {
  [animation grey_setAnimationState:kGREYAnimationStopped];

  if ([self.originalDelegate respondsToSelector:_cmd]) {
    [self.originalDelegate animationDidStop:animation finished:finished];
  }
}

@end
