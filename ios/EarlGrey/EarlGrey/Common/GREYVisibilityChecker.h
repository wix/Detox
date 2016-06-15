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
 *  The minimum number of points that must be visible on an UI element for EarlGrey to consider it
 *  as visible to the user.
 */
extern const NSUInteger kMinimumPointsVisibleForInteraction;

#pragma mark - GREYVisibilityDiffBuffer

/**
 *  Data structure that holds a buffer representing the visible pixels of a visibility check diff.
 */
typedef struct GREYVisibilityDiffBuffer {
  BOOL *data;
  size_t width;
  size_t height;
} GREYVisibilityDiffBuffer;

/**
 *  Creates a diff buffer with the specified width and height. This method allocates a buffer of
 *  size: width * height, which must be released with GREYVisibilityDiffBufferRelease after being
 *  used.
 *
 *  @param width  The width of the diff buffer.
 *  @param height The height of the diff buffer.
 */
GREYVisibilityDiffBuffer GREYVisibilityDiffBufferCreate(size_t width, size_t height);

/**
 *  Releases the underlying storage for the diff buffer.
 *
 *  @param buffer The buffer whose storage is to be released.
 */
void GREYVisibilityDiffBufferRelease(GREYVisibilityDiffBuffer buffer);

/**
 *  Returns the visibility status for the point at the given x and y coordinates. Returns @c YES if
 *  the point is visible, or @c NO if the point isn't visible or lies outside the buffer's bounds.
 *
 *  @param buffer The buffer that is to be queried.
 *  @param x      The x coordinate of the search point.
 *  @param y      The y coordinate of the search point.
 */
BOOL GREYVisibilityDiffBufferIsVisibleAt(GREYVisibilityDiffBuffer buffer, size_t x, size_t y);

/**
 *  Changes the visibility value for the {@c x, @c y} position. If @c isVisible is @c YES the point
 *  is marked as visible else it is marked as not visible.
 *
 *  @param buffer    The buffer whose visibility is to be updated.
 *  @param x         The x coordinate of the target point.
 *  @param y         The y coordinate of the target point.
 *  @param isVisible A boolean that indicates the new visibility status (@c YES for visible,
                     @c NO otherwise) for the target point.
 */
void GREYVisibilityDiffBufferSetVisibilityAt(GREYVisibilityDiffBuffer buffer,
                                             size_t x,
                                             size_t y,
                                             BOOL isVisible);

#pragma mark - GREYVisibilityChecker

/**
 *  Checker for assessing the visibility of elements on screen as they appear to the user.
 */
@interface GREYVisibilityChecker : NSObject

/**
 *  @return @c YES if no part of the @c element is visible to the user.
 */
+ (BOOL)isNotVisible:(id)element;

/**
 *  @return The percentage ([0,1] inclusive) of the area visible on the screen compared to @c
 *          element's accessibility frame.
 */
+ (CGFloat)percentVisibleAreaOfElement:(id)element;

/**
 *  @return @c YES if at least 10 (@c kMinimumPointsVisibleForInteraction) points are visible @b and
 *          the activation point of the given element is also visible, @c NO otherwise.
 */
+ (BOOL)isVisibleForInteraction:(id)element;

/**
 *  @return A visible point where a user can tap to interact with specified @c element, or
 *          @c GREYCGPointNull if there's no such point.
 */
+ (CGPoint)visibleInteractionPointForElement:(id)element;

/**
 *  @return The smallest rectangle enclosing the entire visible area of @c element in screen
 *          coordinates. If no part of the element is visible, CGRectZero will be returned. The
 *          returned rect is always in points.
 */
+ (CGRect)rectEnclosingVisibleAreaOfElement:(id)element;

@end
