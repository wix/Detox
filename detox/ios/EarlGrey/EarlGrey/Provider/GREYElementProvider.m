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

#import "Provider/GREYElementProvider.h"

#import "Assertion/GREYAssertionDefines.h"
#import "Common/GREYConstants.h"
#import "Common/GREYDefines.h"
#import "Provider/GREYDataEnumerator.h"

@implementation GREYElementProvider {
  id<GREYProvider> _rootProvider;
  NSArray *_rootElements;
  NSArray *_elements;
}

+ (instancetype)providerWithElements:(NSArray *)elements {
  return [[GREYElementProvider alloc] initWithElements:elements];
}

+ (instancetype)providerWithRootElements:(NSArray *)rootElements {
  return [[GREYElementProvider alloc] initWithRootElements:rootElements];
}

+ (instancetype)providerWithRootProvider:(id<GREYProvider>)rootProvider {
  return [[GREYElementProvider alloc] initWithRootProvider:rootProvider];
}

- (instancetype)initWithElements:(NSArray *)elements {
  return [self initWithRootProvider:nil orRootElements:nil orElements:elements];
}

- (instancetype)initWithRootElements:(NSArray *)rootElements {
  return [self initWithRootProvider:nil orRootElements:rootElements orElements:nil];
}

- (instancetype)initWithRootProvider:(id<GREYProvider>)rootProvider {
  return [self initWithRootProvider:rootProvider orRootElements:nil orElements:nil];
}

- (instancetype)initWithRootProvider:(id<GREYProvider>)rootProvider
                      orRootElements:(NSArray *)rootElements
                          orElements:(NSArray *)elements {
  NSAssert((rootProvider && !rootElements && !elements) ||
           (!rootProvider && rootElements && !elements) ||
           (!rootProvider && !rootElements && elements),
           @"Must provide exactly one non-nil parameter out of all the parameters accepted by this "
           @"initializer.");
  self = [super init];
  if (self) {
    _rootProvider = rootProvider;
    _rootElements = [rootElements copy];
    _elements = [elements copy];
  }
  return self;
}

#pragma mark - GREYProvider

- (NSEnumerator *)dataEnumerator {
  I_CHECK_MAIN_THREAD();

  NSEnumerator *enumerator;
  if (_rootElements) {
    enumerator = [_rootElements objectEnumerator];
  } else if (_rootProvider) {
    enumerator = [_rootProvider dataEnumerator];
  } else {
    enumerator = [_elements objectEnumerator];
  }

  NSMutableOrderedSet *runningElementHierarchy = [[NSMutableOrderedSet alloc] init];
  __block NSUInteger nextObjectIndex = 0;
  return [[GREYDataEnumerator alloc] initWithUserInfo:nil block:^id(id userinfo) {
    id nextObject;
    @autoreleasepool {
      // If there are no elements left to explore from the current set, add one from the source
      // enumerator.
      if (nextObjectIndex >= runningElementHierarchy.count) {
        // Keep retrieving the next element until finding one that hasn't been considered yet.
        id nextFromEnumerator;
        do {
          nextFromEnumerator = [enumerator nextObject];
        } while(nextFromEnumerator != nil &&
                [runningElementHierarchy containsObject:nextFromEnumerator]);

        // If no next valid element is found, the enumeration should stop.
        if (!nextFromEnumerator) {
          return nil;
        }

        [runningElementHierarchy addObject:nextFromEnumerator];
      }

      nextObject = [runningElementHierarchy objectAtIndex:nextObjectIndex];
      nextObjectIndex++;

      if ([nextObject isKindOfClass:[UIView class]]) {
        // Grab all subviews so that we continue traversing the entire hierarchy.
        // Add the objects in reverse order to make sure that objects on top get matched first.
        NSArray *subviews = [nextObject subviews];
        if ([subviews count] > 0) {
          for (UIView *subview in [subviews reverseObjectEnumerator]) {
            [runningElementHierarchy addObject:subview];
          }
        }
      }

      BOOL nextIsATableView = [nextObject isKindOfClass:[UITableView class]];
      BOOL nextIsATableViewCell = [nextObject isKindOfClass:[UITableViewCell class]];

      // If we encounter an accessibility container, grab all the contained accessibility elements.
      // However, we need to skip a few types of containers:
      // 1) UITableViewCells as they do a lot of custom accessibility work underneath
      //    and the accessibility elements they return are 'mocks' that cause access errors.
      // 2) UITableViews as because they report all their cells, even the ones off-screen as
      //    accessibility elements. We should not consider off-screen cells as there could be
      //    hundreds, even thousands of them and we would be iterating over them unnecessarily.
      //    Worse yet, if the cell isn't visible, calling accessibilityElementAtIndex will create
      //    and initialize them each time.
      if (!nextIsATableViewCell && !nextIsATableView
          && [nextObject respondsToSelector:@selector(accessibilityElementCount)]) {
        NSInteger elementCount = [nextObject accessibilityElementCount];
        if (elementCount != NSNotFound && elementCount > 0) {
          if ([nextObject isKindOfClass:NSClassFromString(@"UIPickerTableView")]) {
            // If we hit a picker table view then we will limit the number of elements to 500 since
            // we don't want to timeout searching through identical views that are created to make
            // it seem like there is an infinite number of items in the picker.
            elementCount = MIN(elementCount, kUIPickerViewMaxAccessibilityViews);
          }
          // Temp holder created by UIKit. What we really want is the underlying element.
          Class accessibilityMockClass = NSClassFromString(@"UIAccessibilityElementMockView");
          for (NSInteger i = elementCount - 1; i >= 0; i--) {
            id element = [nextObject accessibilityElementAtIndex:i];
            if ([element isKindOfClass:accessibilityMockClass]) {
              // Replace mock views with the views they encapsulate.
              element = [element view];
            }
            // Need to add a nil check since sometimes element is nil.
            if (element) {
              [runningElementHierarchy addObject:element];
            }
          }
        }
      }
    }
    return nextObject;
  }];
}

@end
