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

/**
 *  EarlGrey specific additions for traversing and manipulating UIViews.
 */
@interface UIView (GREYAdditions)

/**
 *  @param klass The target class of subviews.
 *
 *  @return A breadth-first / level ordered array of subviews that can be safely casted to @c klass.
 */
- (NSArray *)grey_childElementsAssignableFromClass:(Class)klass;

/**
 *  Makes sure that subview @c view is always on top, even if other subviews are added in front of
 *  it. Also keeps the @c view's frame fixed to the current value so parent can't change it.
 *
 *  @param subview The view to keep as the top-most fixed subview.
 */
- (void)grey_keepSubviewOnTopAndFrameFixed:(UIView *)subview;

/**
 * Sets the view's alpha value to the provided @c alpha value, storing the current value so it can
 * be restored using UIView::grey_restoreAlpha.
 *
 * @param alpha The new alpha value for the view.
 */
- (void)grey_saveCurrentAlphaAndUpdateWithValue:(float)alpha;

/**
 * Restores the view's alpha to the value it contained when
 * UIView::grey_saveCurrentAlphaAndUpdateWithValue: was last invoked.
 */
- (void)grey_restoreAlpha;

/**
 * Quick check to see if a view meets the basic visibility criteria of being not hidden, visible
 * with a minimum alpha and has a valid accessibility frame. It also checks to ensure if a view
 * is not a subview of another view or window that has a translucent alpha value or is hidden.
 */
- (BOOL)grey_isVisible;

@end
