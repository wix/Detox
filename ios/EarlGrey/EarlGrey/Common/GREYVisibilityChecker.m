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

#import "Common/GREYVisibilityChecker.h"

#include <CoreGraphics/CoreGraphics.h>

#import "Additions/CGGeometry+GREYAdditions.h"
#import "Additions/NSObject+GREYAdditions.h"
#import "Additions/UIView+GREYAdditions.h"
#import "Common/GREYConstants.h"
#import "Common/GREYScreenshotUtil.h"
#import "Synchronization/GREYUIThreadExecutor.h"

static const NSUInteger kColorChannelsPerPixel = 4;

/**
 *  The minimum number of points that must be visible along with the activation point to consider an
 *  element visible. It is non-static to make it visible in tests.
 */
const NSUInteger kMinimumPointsVisibleForInteraction = 10;

/**
 *  Last known original image used by the visibility checker is saved in this global for debugging
 *  purposes.
 */
static UIImage *gLastActualBeforeImage;

/**
 *  Last known color shifted image created by the visibility checker is saved in this global for
 *  debugging purposes.
 */
static UIImage *gLastExceptedAfterImage;

/**
 *  Last known actual color shifted image used by visibility checker is saved in this global for
 *  debugging purposes.
 */
static UIImage *gLastActualAfterImage;

#pragma mark - Cache

/**
 *  Cache to store information about element that has been evaluated by visibility checker.
 */
@interface GREYVisibilityCheckerCacheEntry : NSObject

/**
 *  Cached value for percent visible area if it exists, @c nil otherwise.
 */
@property(nonatomic, strong) NSNumber *visibleAreaPercent;
/**
 *  Cached value for visible for interaction check if it exists, @c nil otherwise.
 */
@property(nonatomic, strong) NSValue *visibleInteractionPoint;
/**
 *  Cached value for visible area check if it exists, @c nil otherwise.
 */
@property(nonatomic, strong) NSValue *rectEnclosingVisibleArea;

@end

@implementation GREYVisibilityCheckerCacheEntry
@end

/**
 *  Cache for storing recent visibility checks. This cache is invalidated on the next runloop drain.
 */
static NSMapTable *gCache;

#pragma mark - GREYVisibilityDiffBuffer

GREYVisibilityDiffBuffer GREYVisibilityDiffBufferCreate(size_t width, size_t height) {
  GREYVisibilityDiffBuffer diffBuffer;
  diffBuffer.width = width;
  diffBuffer.height = height;
  diffBuffer.data = (BOOL *)malloc(sizeof(BOOL) * width * height);
  if (diffBuffer.data == NULL) {
    NSLog(@"diffBuffer.data is NULL.");
    abort();
  }
  return diffBuffer;
}

void GREYVisibilityDiffBufferRelease(GREYVisibilityDiffBuffer buffer) {
  if (buffer.data == NULL) {
    NSLog(@"buffer.data is NULL.");
    abort();
  }
  free(buffer.data);
}

BOOL GREYVisibilityDiffBufferIsVisibleAt(GREYVisibilityDiffBuffer buffer, size_t x, size_t y) {
  if (x >= buffer.width || y >= buffer.height) {
    return NO;
  }

  return buffer.data[y * buffer.width + x];
}

inline void GREYVisibilityDiffBufferSetVisibilityAt(GREYVisibilityDiffBuffer buffer,
                                                  size_t x,
                                                  size_t y,
                                                  BOOL value) {
  if (x >= buffer.width || y >= buffer.height) {
    NSLog(@"Warning: trying to access a point outside the diff buffer: {%zu, %zu}", x, y);
    return;
  }

  buffer.data[y * buffer.width + x] = value;
}

#pragma mark - GREYVisibilityChecker

@implementation GREYVisibilityChecker

+ (BOOL)isNotVisible:(id)element {
  if (!element) {
    return YES;
  }

  return [self percentVisibleAreaOfElement:element] == 0;
}

+ (CGFloat)percentVisibleAreaOfElement:(id)element {
  if (!element) {
    return 0;
  }

  GREYVisibilityCheckerCacheEntry *cache = [self grey_cacheForElementCreateIfNonExistent:element];
  NSNumber *percentVisible = [cache visibleAreaPercent];
  if (!percentVisible) {
    percentVisible = @([self grey_percentElementVisibleOnScreen:element]);
    NSAssert([percentVisible floatValue] >= 0.0f && [percentVisible floatValue] <= 1.0f,
             @"percentVisible(%f) must be in the range [0,1]", [percentVisible floatValue]);
    [cache setVisibleAreaPercent:percentVisible];
  }

  return [percentVisible floatValue];
}

+ (BOOL)isVisibleForInteraction:(id)element {
  CGPoint interactionPoint = [self visibleInteractionPointForElement:element];
  return !CGPointIsNull(interactionPoint);
}

+ (CGRect)rectEnclosingVisibleAreaOfElement:(id)element {
  // TODO: Add support for accessibility elements, if needed.
  NSAssert([element isKindOfClass:[UIView class]],
           @"Only elements of kind UIView are supported by this method.");

  GREYVisibilityCheckerCacheEntry *cache = [self grey_cacheForElementCreateIfNonExistent:element];
  NSValue *rectValue = [cache rectEnclosingVisibleArea];
  if (rectValue) {
    return [rectValue CGRectValue];
  }

  UIView *view = element;
  CGImageRef beforeImage = NULL;
  CGImageRef afterImage = NULL;
  CGPoint origin = CGPointZero;
  BOOL viewIntersectsScreen =
      [GREYVisibilityChecker grey_captureBeforeImage:&beforeImage
                                       andAfterImage:&afterImage
                            andGetIntersectionOrigin:&origin
                                             forView:view
                                          withinRect:[view accessibilityFrame]];
  CGRect visibleAreaRect = CGRectZero;
  if (viewIntersectsScreen) {
    [GREYVisibilityChecker grey_countPixelsInImage:afterImage
                       thatAreShiftedPixelsOfImage:beforeImage
                       storeVisiblePixelRectInRect:&visibleAreaRect
                  andStoreComparisonResultInBuffer:NULL];
  }

  CGImageRelease(beforeImage);
  CGImageRelease(afterImage);

  if (!CGRectIsEmpty(visibleAreaRect)) {
    // |visibleAreaRectInPoints| must be offset by its origin within the screenshot before we can
    // convert it to points coordinates.
    visibleAreaRect = CGRectOffset(visibleAreaRect, origin.x, origin.y);
    visibleAreaRect = CGRectPixelToPoint(visibleAreaRect);
    if (!iOS8_0_OR_ABOVE()) {
      visibleAreaRect = CGRectVariableToFixedScreenCoordinates(visibleAreaRect);
    }
  }
  // Cache result before returning.
  [cache setRectEnclosingVisibleArea:[NSValue valueWithCGRect:visibleAreaRect]];
  return visibleAreaRect;
}

+ (CGPoint)visibleInteractionPointForElement:(id)element {
  if (!element) {
    // Nil elements are not considered visible for interaction.
    return GREYCGPointNull;
  }

  GREYVisibilityCheckerCacheEntry *cache = [self grey_cacheForElementCreateIfNonExistent:element];
  NSValue *cachedPointValue = [cache visibleInteractionPoint];
  if (cachedPointValue) {
    return [cachedPointValue CGPointValue];
  }

  UIView *view = [self grey_containingViewIfNonView:element];
  if (!view) {
    // Non-UIView elements without a container are considered NOT visible for interaction.
    [cache setVisibleInteractionPoint:[NSValue valueWithCGPoint:GREYCGPointNull]];
    return GREYCGPointNull;
  }

  CGRect elementFrame = [element accessibilityFrame];

  CGImageRef beforeImage = NULL;
  CGImageRef afterImage = NULL;

  CGPoint intersectionPointInVariablePixels;
  BOOL viewIntersectsScreen =
      [GREYVisibilityChecker grey_captureBeforeImage:&beforeImage
                                       andAfterImage:&afterImage
                            andGetIntersectionOrigin:&intersectionPointInVariablePixels
                                             forView:view
                                          withinRect:elementFrame];

  CGPoint interactionPointInFixedPoints = GREYCGPointNull;

  if (viewIntersectsScreen) {
    const CGFloat scale = [[UIScreen mainScreen] scale];
    const size_t widthInPixels = (size_t)CGImageGetWidth(beforeImage);
    const size_t heightInPixels = (size_t)CGImageGetHeight(beforeImage);

    const size_t minimumPixelsVisibleForInteraction =
        (size_t)(kMinimumPointsVisibleForInteraction * scale);

    // If the element hasn't a minimum area in pixels, extra checks are unnecessary.
    const size_t elementAreaInPixels = widthInPixels * heightInPixels;
    if (elementAreaInPixels < minimumPixelsVisibleForInteraction) {
      [cache setVisibleInteractionPoint:[NSValue valueWithCGPoint:GREYCGPointNull]];
      CGImageRelease(beforeImage);
      CGImageRelease(afterImage);
      return GREYCGPointNull;
    }

    GREYVisibilityDiffBuffer diffBuffer =
        GREYVisibilityDiffBufferCreate(widthInPixels, heightInPixels);

    // visiblePixelRect will contain the minimum rect containing all visible pixels, and a sub-area
    // of the diffBuffer rectangle, which is the intersection of the view and the screen.
    CGRect visibleRectInVariablePixels;
    // visiblePixelCount will contain the count of all visibile pixels inside that rect.
    size_t visiblePixelCount = [self grey_countPixelsInImage:afterImage
                                 thatAreShiftedPixelsOfImage:beforeImage
                                 storeVisiblePixelRectInRect:&visibleRectInVariablePixels
                            andStoreComparisonResultInBuffer:&diffBuffer];

    CGPoint interactionPointInVariablePixels = GREYCGPointNull;

    if (visiblePixelCount >= minimumPixelsVisibleForInteraction) {
      // If the activation point lies inside the screen, use it if it is visible.
      CGPoint activationPoint = [element accessibilityActivationPoint];

      if (CGRectContainsPoint([[UIScreen mainScreen] bounds], activationPoint)) {
        CGPoint activationPointInVariablePixels = activationPoint;
        if (!iOS8_0_OR_ABOVE()) {
          activationPointInVariablePixels = CGPointFixedToVariable(activationPoint);
        }
        activationPointInVariablePixels = CGPointToPixel(activationPointInVariablePixels);

        CGPoint relativeActivationPointInVariablePixels =
            CGPointMake(activationPointInVariablePixels.x - intersectionPointInVariablePixels.x,
                        activationPointInVariablePixels.y - intersectionPointInVariablePixels.y);

        if (relativeActivationPointInVariablePixels.x >= 0 &&
            relativeActivationPointInVariablePixels.y >= 0 &&
            GREYVisibilityDiffBufferIsVisibleAt(diffBuffer,
                                              (size_t)relativeActivationPointInVariablePixels.x,
                                              (size_t)relativeActivationPointInVariablePixels.y)) {
            interactionPointInVariablePixels = relativeActivationPointInVariablePixels;
        }
      }

      // If the activation point is not a valid point, use the center of the visible area if it
      // is visible.
      CGPoint centerOfVisibleAreaInVariablePixels = CGRectCenter(visibleRectInVariablePixels);

      if (CGPointIsNull(interactionPointInFixedPoints) &&
          GREYVisibilityDiffBufferIsVisibleAt(diffBuffer,
                                            (size_t)centerOfVisibleAreaInVariablePixels.x,
                                            (size_t)centerOfVisibleAreaInVariablePixels.y)) {
        interactionPointInVariablePixels = centerOfVisibleAreaInVariablePixels;
        interactionPointInVariablePixels.x += intersectionPointInVariablePixels.x;
        interactionPointInVariablePixels.y += intersectionPointInVariablePixels.y;
      }

      // At this point the interaction point is in variable screen coordinates, but the expected
      // output is in fixed view coordinates so it needs to be converted.
      interactionPointInFixedPoints = CGPixelToPoint(interactionPointInVariablePixels);
      if (!iOS8_0_OR_ABOVE()) {
        interactionPointInFixedPoints = CGPointVariableToFixed(interactionPointInFixedPoints);
      }
      interactionPointInFixedPoints = [view.window convertPoint:interactionPointInFixedPoints
                                                     fromWindow:nil];
      interactionPointInFixedPoints = [view convertPoint:interactionPointInFixedPoints
                                                fromView:nil];

      // If the element is an accessibility view, the interaction point has to be further converted
      // into its coordinate system.
      if (element != view) {
        CGRect axFrameRelativeToView = [view.window convertRect:[element accessibilityFrame]
                                                     fromWindow:nil];
        axFrameRelativeToView = [view convertRect:axFrameRelativeToView fromView:nil];

        interactionPointInFixedPoints.x -= axFrameRelativeToView.origin.x;
        interactionPointInFixedPoints.y -= axFrameRelativeToView.origin.y;
      }
    }

    GREYVisibilityDiffBufferRelease(diffBuffer);
  }

  CGImageRelease(beforeImage);
  CGImageRelease(afterImage);

  [cache setVisibleInteractionPoint:[NSValue valueWithCGPoint:interactionPointInFixedPoints]];
  return interactionPointInFixedPoints;
}

#pragma mark - Private

/**
 *  @return The cached key for an @c element.
 */
+ (NSString *)grey_keyForElement:(id)element {
  return [NSString stringWithFormat:@"%p", element];
}

/**
 *  Saves a cache @c entry for an @c element and adds it for invalidation on the next runloop drain.
 *
 *  @param entry   The cache entry to be saved.
 *  @param element The element to which the entry is associated.
 */
+ (void)grey_addCache:(GREYVisibilityCheckerCacheEntry *)entry forElement:(id)element {
  if (!gCache) {
    gCache = [NSMapTable strongToStrongObjectsMapTable];
  }

  // Get the pointer value and store it as a string.
  NSString *elementKey = [self grey_keyForElement:element];
  [gCache setObject:entry forKey:elementKey];

  // Set us up for invalidation on the next runloop drain.
  static BOOL pendingInvalidation = NO;
  if (!pendingInvalidation) {
    pendingInvalidation = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
      pendingInvalidation = NO;
      [GREYVisibilityChecker grey_invalidateCache];
    });
  }
}

/**
 *  Returns cached value for an @c element. Modifying the returned cache also modifies it in the
 *  backing store so any changes are visible next time cache is fetched for the same @c element,
 *  provided the cache is still valid.
 *
 *  @param element The element whose cache is being queried.
 *
 *  @return The cached stored under the given @c element.
 */
+ (GREYVisibilityCheckerCacheEntry *)grey_cacheForElementCreateIfNonExistent:(id)element {
  if (!element) {
    return nil;
  }
  GREYVisibilityCheckerCacheEntry *entry;
  if (gCache) {
    NSString *elementKey = [self grey_keyForElement:element];
    entry = [gCache objectForKey:elementKey];
  }

  if (!entry) {
    entry = [[GREYVisibilityCheckerCacheEntry alloc] init];
    [self grey_addCache:entry forElement:element];
  }
  return entry;
}

/**
 *  Invalidates the global cache of visibility checks.
 */
+ (void)grey_invalidateCache {
  [gCache removeAllObjects];
}

/**
 *  Returns fraction of the total area of @c element that is visible to the user. Any part of the
 *  element that is obscured or off-screen is considered not visible. Return value of 0 means that
 *  no part of the element is visible on screen. That might mean that element is off-screen, or it
 *  could be on-screen, but covered by another element. Return value of 1 means that the entire
 *  element is visible on screen, which means that the entire frame of the element is on-screen, and
 *  no part of the element is obscured by another element. If any part of the element is off-screen,
 *  the return value will be less than 1, even if this element is covering the entire screen and no
 *  part of it is obscured by another element.
 *
 *  @param element The element whose percent area is being queried.
 *
 *  @return The percent area in range [0,1], of the @c element that is visible on the screen.
 */
+ (double)grey_percentElementVisibleOnScreen:(id)element {
  UIView *view = [self grey_containingViewIfNonView:element];
  return [self grey_percentViewVisibleOnScreen:view withinRect:[element accessibilityFrame]];
}

/**
 *  Returns fraction of the total area of @c element that is visible to the user. Any part of the
 *  element that is obscured or off-screen is considered not visible. Return value of 0 means that
 *  no part of the element is visible on screen. That might mean that element is off-screen, or it
 *  could be on-screen, but covered by another element. Return value of 1 means that the entire
 *  element is visible on screen, which means that the entire frame of the element is on-screen, and
 *  no part of the element is obscured by another element. If any part of the element is off-screen,
 *  the return value will be less than 1, even if this element is covering the entire screen and no
 *  part of it is obscured by another element.
 *
 *  @param element The non-view element whose percent area is being queried.
 *
 *  @return The percent area in range [0,1], of the @c element that is visible on the screen.
 */
+ (double)grey_percentNonViewVisibleOnScreen:(id)element {
  NSParameterAssert(![element isKindOfClass:[UIView class]]);
  if (![element isKindOfClass:[NSObject class]] ||
      ![element respondsToSelector:@selector(accessibilityFrame)] ||
      CGRectIsEmpty([element accessibilityFrame])) {
    return 0;
  }

  return [self grey_percentViewVisibleOnScreen:[self grey_containingViewIfNonView:element]
                                    withinRect:[element accessibilityFrame]];
}

/**
 *  The logic behind the implementation is that it takes 2 screenshots, one before any modification
 *  and one after. The latter contains modification to UIView by adding an inverted image to it that
 *  is visible on top all subviews. The actual visibility check calculates how many pixels changed
 *  before and after the modification, and returns fraction of area of the element that changed out
 *  of the entire area of the element. This check is restricted to only consider a certain rectangle
 *  inside a view, in screen coordinates. This may naturally be set to the entire view.
 *
 *  @param view                          The view whose percent visible area is being queried.
 *  @param searchRectInScreenCoordinates A rect in screen coordinates within which the visibility
 *                                       check is to be performed.
 *
 *  @return The percent area in range [0,1], of the @c element that is visible within the search
 *          rect.
 */
+ (double)grey_percentViewVisibleOnScreen:(UIView *)view
                             withinRect:(CGRect)searchRectInScreenCoordinates {
  CGImageRef beforeImage = NULL;
  CGImageRef afterImage = NULL;
  BOOL viewIntersectsScreen =
      [GREYVisibilityChecker grey_captureBeforeImage:&beforeImage
                                       andAfterImage:&afterImage
                            andGetIntersectionOrigin:NULL
                                             forView:view
                                          withinRect:searchRectInScreenCoordinates];
  double percentVisible = 0;
  if (viewIntersectsScreen) {
    // Count number of whole pixels in entire search area, including areas off screen or outside
    // view.
    CGRect searchRect_pixels = CGRectPointToPixel(searchRectInScreenCoordinates);
    double countTotalSearchRectPixels = CGRectArea(CGRectIntegralInside(searchRect_pixels));
    NSAssert(countTotalSearchRectPixels >= 1, @"countTotalSearchRectPixels should be at least 1");
    NSUInteger countTotalVisiblePixels = [self grey_countPixelsInImage:afterImage
                                                  thatAreShiftedPixelsOfImage:beforeImage
                                                  storeVisiblePixelRectInRect:NULL
                                             andStoreComparisonResultInBuffer:NULL];
    percentVisible = countTotalVisiblePixels / countTotalSearchRectPixels;
  }

  CGImageRelease(beforeImage);
  CGImageRelease(afterImage);

  NSLog(@"Percent Visible: %0.1f%%", (double)(percentVisible * 100.0));
  NSAssert(0 <= percentVisible, @"percentVisible should not be negative");

  return percentVisible;
}

+ (UIView *)grey_containingViewIfNonView:(id)element {
  return ([element isKindOfClass:[UIView class]] ? element : [element grey_viewContainingSelf]);
}

/**
 *  Captures the visibility check's before and after image for the given @c view and loads the pixel
 *  data into the given @c beforeImage and @c afterImage and returns @c YES if at least one pixel
 *  from the view intersects with the given @c searchRectInScreenCoordinates, @c NO otherwise.
 *  Optionally the method also stores the intersection point of the screen, view and search rect
 *  (in pixels) at @c outIntersectionOriginOrNull. The caller must release @c beforeImage and
 *  @c afterImage using CGImageRelease once done using them.
 *
 *  @param[out] outBeforeImage                A reference to receive the before-check image.
 *  @param[out] outAfterImage                 A reference to receive the after-check image.
 *  @param[out] outIntersectionOriginOrNull   A reference to receive the origin of the view in
 *                                            the given search rect.
 *  @param      view                          The view whose visibility check is being performed.
 *  @param      searchRectInScreenCoordinates A rect in screen coordinates within which the
 *                                            visibility check is to be performed.
 *
 *  @return @c YES if at least one pixel from the view intersects with the given
 *          @c searchRectInScreenCoordinates, @c NO otherwise.
 */
+ (BOOL)grey_captureBeforeImage:(CGImageRef *)outBeforeImage
                andAfterImage:(CGImageRef *)outAfterImage
     andGetIntersectionOrigin:(CGPoint *)outIntersectionOriginOrNull
                      forView:(UIView *)view
                   withinRect:(CGRect)searchRectInScreenCoordinates {
  NSParameterAssert(outBeforeImage);
  NSParameterAssert(outAfterImage);

  if (![view grey_isVisible] || CGRectIsEmpty(searchRectInScreenCoordinates)) {
    return NO;
  }

  // Find portion of search rect that is on screen and in view.
  CGRect screenBounds = [[UIScreen mainScreen] bounds];
  CGRect axFrame = [view accessibilityFrame];
  CGRect searchRectOnScreenInViewInScreenCoordinates =
      CGRectIntersection(searchRectInScreenCoordinates,
                         CGRectIntersection(axFrame, screenBounds));
  if (CGRectIsEmpty(searchRectOnScreenInViewInScreenCoordinates)) {
    return NO;
  }

  // Calculate the search rectangle for screenshot.
  CGRect screenshotSearchRect_pixel =
      iOS8_0_OR_ABOVE() ? searchRectOnScreenInViewInScreenCoordinates
      : CGRectFixedToVariableScreenCoordinates(searchRectOnScreenInViewInScreenCoordinates);
  screenshotSearchRect_pixel = CGRectPointToPixel(screenshotSearchRect_pixel);
  screenshotSearchRect_pixel = CGRectIntegralInside(screenshotSearchRect_pixel);

  // Set screenshot origin point.
  if (outIntersectionOriginOrNull) {
    *outIntersectionOriginOrNull = screenshotSearchRect_pixel.origin;
  }

  if (screenshotSearchRect_pixel.size.width == 0 || screenshotSearchRect_pixel.size.height == 0) {
    return NO;
  }

  // Take an image before doing any modification. This is image of the pristine state of view.
  UIImage *beforeScreenshot = [GREYScreenshotUtil takeScreenshot];
  CGImageRef beforeImage =
      CGImageCreateWithImageInRect(beforeScreenshot.CGImage, screenshotSearchRect_pixel);
  if (!beforeImage) {
    return NO;
  }

  // View with shifted colors will be added on top of all the subviews of view. We offset the view
  // to make it appear in the correct location. If we are checking for visibility of a scroll view,
  // visibility checker will take a picture of the entire UIScrollView, and adjust the frame of
  // shiftedBeforeImageView to position it correctly within the UIScrollView.
  // In iOS 7, UIScrollViews are often full-screen, and a part of them is hidden behind the
  // navigation bar. ContentInsets are set automatically to make this happen seamlessly. In this
  // case, EarlGrey will take a picture of the entire UIScrollView, including the navigation bar,
  // to check visibility, but because navigation bar covers only a small portion of the scroll view,
  // it will still be above the visibility threshold.

  // Calculate the search rectangle in view coordinates.
  CGRect searchRectOnScreenInViewInWindowCoordinates =
      [view.window convertRect:searchRectOnScreenInViewInScreenCoordinates fromWindow:nil];
  CGRect searchRectOnScreenInViewInViewCoordinates =
      [view convertRect:searchRectOnScreenInViewInWindowCoordinates fromView:nil];

  CGRect rectAfterPixelAlignment = CGRectPixelToPoint(screenshotSearchRect_pixel);
  // Offset must be in variable screen coordinates.
  CGRect searchRectOnScreenInViewInVariableScreenCoordinates = iOS8_0_OR_ABOVE()
      ? searchRectOnScreenInViewInScreenCoordinates
      : CGRectFixedToVariableScreenCoordinates(searchRectOnScreenInViewInScreenCoordinates);
  CGFloat xPixelAlignmentDiff = CGRectGetMinX(rectAfterPixelAlignment) -
      CGRectGetMinX(searchRectOnScreenInViewInVariableScreenCoordinates);
  CGFloat yPixelAlignmentDiff = CGRectGetMinY(rectAfterPixelAlignment) -
      CGRectGetMinY(searchRectOnScreenInViewInVariableScreenCoordinates);

  CGFloat searchRectOffsetX =
      CGRectGetMinX(searchRectOnScreenInViewInViewCoordinates) + xPixelAlignmentDiff;
  CGFloat searchRectOffsetY =
      CGRectGetMinY(searchRectOnScreenInViewInViewCoordinates) + yPixelAlignmentDiff;

  CGPoint searchRectOffset = CGPointMake(searchRectOffsetX, searchRectOffsetY);
  UIView *shiftedView =
      [self grey_imageViewWithShiftedColorOfImage:beforeImage
                                      frameOffset:searchRectOffset
                                      orientation:beforeScreenshot.imageOrientation];
  UIImage *afterScreenshot = [self grey_imageAfterAddingSubview:shiftedView toView:view];
  CGImageRef afterImage =
      CGImageCreateWithImageInRect(afterScreenshot.CGImage, screenshotSearchRect_pixel);
  if (!afterImage) {
    NSAssert(NO, @"afterImage should not be null");
    CGImageRelease(beforeImage);
    return NO;
  }
  *outBeforeImage = beforeImage;
  *outAfterImage = afterImage;

  gLastActualBeforeImage = [UIImage imageWithCGImage:beforeImage];
  gLastActualAfterImage = [UIImage imageWithCGImage:afterImage];

  return YES;
}

+ (UIImage *)grey_imageAfterAddingSubview:(UIView *)shiftedView toView:(UIView *)view {
  NSParameterAssert(shiftedView);
  NSParameterAssert(view);

  // Rasterizing induces flakiness by re-drawing the view frame by frame for any layout change and
  // caching it for further use. This brings a delay in refreshing the layout for the shiftedView.
  BOOL isRasterizingLayer = view.layer.shouldRasterize;
  view.layer.shouldRasterize = NO;

  [CATransaction begin];
  [CATransaction setDisableActions:YES];

  // Views with non-zero opacity need to have their opacity reset to 1.0 when taking the screenshot
  // because the shifted view, being a child of the view, will inherit its opacity. The problem with
  // that is that shifted view is created from a screenshot of the view with its original opacity,
  // so if we just add the shifted view as a subview of view the opacity change will be applied once
  // more. This may result on false negatives, specially on anti-aliased text. To make sure the
  // opacity won't affect the screenshot, we need to apply the change to the view and all of its
  // parents, then reset the changes when done.
  UIView *viewToChangeAlpha = view;
  while (viewToChangeAlpha) {
    [viewToChangeAlpha grey_saveCurrentAlphaAndUpdateWithValue:1.0];
    viewToChangeAlpha = viewToChangeAlpha.superview;
  }

  [view addSubview:shiftedView];
  [view grey_keepSubviewOnTopAndFrameFixed:shiftedView];
  [view layoutIfNeeded];
  [view.window setNeedsDisplay];
  [CATransaction commit];
  [CATransaction flush];

  UIImage *screenshot = [GREYScreenshotUtil takeScreenshot];

  // Restore view to original state.
  [CATransaction begin];
  [CATransaction setDisableActions:YES];

  // Restore the opacity values of the view and its parents.
  viewToChangeAlpha = view;
  while (viewToChangeAlpha) {
    [viewToChangeAlpha grey_restoreAlpha];
    viewToChangeAlpha = viewToChangeAlpha.superview;
  }

  [shiftedView removeFromSuperview];
  [view layoutIfNeeded];
  [view.window setNeedsDisplay];
  [CATransaction commit];
  [CATransaction flush];

  view.layer.shouldRasterize = isRasterizingLayer;

  return screenshot;
}

/**
 *  Returns the number of pixels in @c afterImage that are shifted pixels of @c beforeImage. If @c
 *  visiblePixelRect is not NULL, stores the smallest rectangle enclosing all shifted pixels in *@c
 *  visiblePixelRect. If no shifted pixels are found, *@c visiblePixelRect will be CGRectZero.
 *  @todo Use a better image comparison library/tool for this stuff. For now, pixel-by-pixel
 *        comparison it is.
 *
 *  @param      afterImage          The image containing view with shifted colors.
 *  @param      beforeImage         The original image of the view.
 *  @param[out] outVisiblePixelRect A reference for getting the smallest rectangle enclosing all
 *                                  shifted pixels.
 *  @param[out] outDiffBufferOrNULL A reference for getting the GREYVisibilityDiffBuffer that was
 *                                  created to detect image diff.
 *
 *  @return The number of pixels in @c afterImage that are shifted pixels of @c beforeImage.
 */
+ (NSUInteger)grey_countPixelsInImage:(CGImageRef)afterImage
         thatAreShiftedPixelsOfImage:(CGImageRef)beforeImage
         storeVisiblePixelRectInRect:(CGRect *)outVisiblePixelRect
    andStoreComparisonResultInBuffer:(GREYVisibilityDiffBuffer *)outDiffBufferOrNULL {
  NSParameterAssert(beforeImage);
  NSParameterAssert(afterImage);
  NSAssert(CGImageGetWidth(beforeImage) == CGImageGetWidth(afterImage),
           @"width must be the same");
  NSAssert(CGImageGetHeight(beforeImage) == CGImageGetHeight(afterImage),
           @"height must be the same");

  unsigned char *pixelBuffer = grey_createImagePixelDataFromCGImageRef(beforeImage, NULL);
  NSAssert(pixelBuffer, @"pixelBuffer must not be null");
  unsigned char *shiftedPixelBuffer = grey_createImagePixelDataFromCGImageRef(afterImage, NULL);
  NSAssert(shiftedPixelBuffer, @"shiftedPixelBuffer must not be null");

  NSUInteger width = CGImageGetWidth(beforeImage);
  NSUInteger height = CGImageGetHeight(beforeImage);
  CGFloat minX = FLT_MAX;
  CGFloat maxX = -FLT_MAX;
  CGFloat minY = FLT_MAX;
  CGFloat maxY = -FLT_MAX;
  NSUInteger totalMatch = 0;
  for (NSUInteger x = 0; x < width; x++) {
    for (NSUInteger y = 0; y < height; y++) {
      NSUInteger currentPixelIndex = (y * width + x) * kColorChannelsPerPixel;
      // We don't care about the first byte because we are dealing with XRGB format.
      BOOL pixelHasDiff = grey_isColorDifferent(&pixelBuffer[currentPixelIndex + 1],
                                              &shiftedPixelBuffer[currentPixelIndex + 1]);
      if (pixelHasDiff) {
        totalMatch++;
        minX = MIN(minX, x);
        maxX = MAX(maxX, x);
        minY = MIN(minY, y);
        maxY = MAX(maxY, y);
      }

      if (outDiffBufferOrNULL) {
        GREYVisibilityDiffBufferSetVisibilityAt(*outDiffBufferOrNULL, x, y, pixelHasDiff);
      }
    }
  }
  if (outVisiblePixelRect) {
    // Width and height require a +1 to accomodate single pixel images.
    *outVisiblePixelRect =
        totalMatch > 0 ? CGRectMake(minX, minY, maxX - minX + 1, maxY - minY + 1) : CGRectZero;
  }

  free(pixelBuffer);
  free(shiftedPixelBuffer);
  return totalMatch;
}

/**
 *  Creates a UIImageView and adds a shifted color image of @c imageRef to it, in addition
 *  view.frame is offset by @c offset and image orientation set to @c orientation. There are 256
 *  possible values for a color component, from 0 to 255. Each color component will be shifted by
 *  exactly 128, examples: 0 => 128, 64 => 192, 128 => 0, 255 => 127.
 *
 *  @param imageRef The image whose colors are to be shifted.
 *  @param offset The frame offset to be applied to resulting view.
 *  @param orientation The target orientation of the image added to the resulting view.
 *
 *  @return A view containing shifted color image of @c imageRef with view.frame offset by
 *          @c offset and orientation set to @c orientation.
 */
+ (UIView *)grey_imageViewWithShiftedColorOfImage:(CGImageRef)imageRef
                                    frameOffset:(CGPoint)offset
                                    orientation:(UIImageOrientation)orientation {
  NSParameterAssert(imageRef);

  size_t width = CGImageGetWidth(imageRef);
  size_t height = CGImageGetHeight(imageRef);
  // TODO: Find a good way to compute imagePixelData of before image only once without
  // negatively impacting the readability of code in visibility checker.
  unsigned char *shiftedImagePixels = grey_createImagePixelDataFromCGImageRef(imageRef, NULL);

  for (NSUInteger i = 0; i < height * width; i++) {
    NSUInteger currentPixelIndex = kColorChannelsPerPixel * i;
    // We don't care about the first byte because we are dealing with XRGB format.
    shiftedImagePixels[currentPixelIndex + 1] =
        (shiftedImagePixels[currentPixelIndex + 1] + 128) % 256;
    shiftedImagePixels[currentPixelIndex + 2] =
        (shiftedImagePixels[currentPixelIndex + 2] + 128) % 256;
    shiftedImagePixels[currentPixelIndex + 3] =
        (shiftedImagePixels[currentPixelIndex + 3] + 128) % 256;
  }

  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  CGContextRef bitmapContext =
      CGBitmapContextCreate(shiftedImagePixels,
                            width,
                            height,
                            8,
                            kColorChannelsPerPixel * width,
                            colorSpace,
                            kCGImageAlphaNoneSkipFirst | kCGBitmapByteOrder32Big);

  CGColorSpaceRelease(colorSpace);

  CGImageRef bitmapImageRef = CGBitmapContextCreateImage(bitmapContext);
  UIImage *shiftedImage = [UIImage imageWithCGImage:bitmapImageRef
                                              scale:[[UIScreen mainScreen] scale]
                                        orientation:orientation];

  CGImageRelease(bitmapImageRef);
  CGContextRelease(bitmapContext);
  free(shiftedImagePixels);

  gLastExceptedAfterImage = shiftedImage;

  UIImageView *shiftedImageView = [[UIImageView alloc] initWithImage:shiftedImage];
  shiftedImageView.frame = CGRectOffset(shiftedImageView.frame, offset.x, offset.y);
  shiftedImageView.opaque = YES;
  return shiftedImageView;
}

/**
 *  @return @c true if the encoded rgb1[R, G, B] color values are different from rbg2[R, G, B]
 *          values, @c false otherwise.
 *  @todo Ideally, we should be testing that pixel colors are shifted by a certain amount instead of
 *        checking if they are simply different. However, the naive check for shifted colors doesn't
 *        work if pixels are overlapped by a translucent mask or have special layer-filters applied
 *        to it. Because they are still visible to user and we want to avoid false-negatives that
 *        would cause the test to fail, we resort to a naive check that rbg1 and rgb2 are not the
 *        same without specifying the exact delta between them.
 */
static inline bool grey_isColorDifferent(unsigned char rgb1[], unsigned char rgb2[]) {
  int redDiff = abs(rgb1[0] - rgb2[0]);
  int greenDiff = abs(rgb1[1] - rgb2[1]);
  int blueDiff = abs(rgb1[2] - rgb2[2]);
  return (redDiff > 0) || (greenDiff > 0) || (blueDiff > 0);
}

+ (UIImage *)grey_lastActualBeforeImage {
  return gLastActualBeforeImage;
}

+ (UIImage *)grey_lastActualAfterImage {
  return gLastActualAfterImage;
}

+ (UIImage *)grey_lastExpectedAfterImage {
  return gLastExceptedAfterImage;
}

@end
