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

//
// Exposes methods, classes and globals for Unit Testing.
//
#import <EarlGrey/GREYAppStateTracker.h>
#import <EarlGrey/GREYElementHierarchy.h>
#import <EarlGrey/GREYProvider.h>
#import <EarlGrey/GREYTimedIdlingResource.h>
#import <EarlGrey/GREYUIThreadExecutor.h>
#import <EarlGrey/GREYVisibilityChecker.h>
#import <EarlGrey/UIView+GREYAdditions.h>

// Indicates the minimum scroll length required for any scroll to be detected, currently defined in
// GREYPathGestureUtils.m.
extern const NSInteger kGREYScrollDetectionLength;

@interface NSObject (GREYExposedForTesting)
- (BOOL)grey_isWebAccessibilityElement;
@end

@interface GREYAppStateTracker (GREYExposedForTesting)
- (GREYAppState)grey_lastKnownStateForElement:(id)element;
@end

@interface GREYDispatchQueueIdlingResource (EGExposedForTesting)
+ (instancetype)grey_resourceForCurrentlyTrackedDispatchQueue:(dispatch_queue_t)queue;
@end

@interface GREYUIThreadExecutor (EGExposedForTesting)
@property(nonatomic, assign) BOOL shouldSkipMonitoringDefaultIdlingResourcesForTesting;
- (BOOL)grey_areAllResourcesIdle;
- (void)grey_deregisterAllIdlingResources;
@end

@interface CALayer (GREYExposedForTesting)
- (NSMutableSet *)pausedAnimationKeys;
@end

@interface CAAnimation (GREYExposedForTesting)
- (void)grey_trackForDurationOfAnimation;
@end

@interface GREYVisibilityChecker (GREYExposedForTesting)
+ (NSUInteger)grey_countPixelsInImage:(CGImageRef)afterImage
           thatAreShiftedPixelsOfImage:(CGImageRef)beforeImage
           storeVisiblePixelRectInRect:(CGRect *)outVisiblePixelRect
      andStoreComparisonResultInBuffer:(GREYVisibilityDiffBuffer *)outDiffBufferOrNULL;
@end

@interface GREYElementHierarchy (GREYExposedForTesting)
+ (NSString *)grey_printDescriptionForElement:(id)element
                                    atLevel:(NSUInteger)level;
+ (NSArray *)grey_orderedChildrenOf:(id)element;
+ (NSString *) grey_recursivePrint:(id)element
                       withLevel:(NSUInteger)level
                    outputString:(NSMutableString *)outputString
         andAnnotationDictionary:(NSDictionary *)annotationDictionary;
@end
