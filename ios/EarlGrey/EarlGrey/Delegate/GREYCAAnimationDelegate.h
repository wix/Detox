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

#import <EarlGrey/GREYSurrogateDelegate.h>
#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

@interface GREYCAAnimationDelegate : GREYSurrogateDelegate

/**
 *  @remark init is not an available initializer. Use the other initializers.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 *  Creates an instance of GREYCAAnimationDelegate backed by the provided delegate.
 *
 *  @param delegate The original delegate being proxied.
 *  @return an instance of GREYCAAnimationDelegate backed by the original delegate.
 */
- (instancetype)initWithOriginalCAAnimationDelegate:(id)originalDelegate;

/**
 *  Called when the animation begins its active duration.
 *
 *  @param animation The animation that has started.
 */
- (void)animationDidStart:(CAAnimation *)animation;

/**
 *  Called when the animation completes its active duration or is removed from the object it is
 *  attached to.
 *
 *  @param animation The animation that has stopped.
 *  @param finished  @c YES if the animation has finished, @c NO if it stopped for other reasons.
 */
- (void)animationDidStop:(CAAnimation *)animation finished:(BOOL)finished;

@end
