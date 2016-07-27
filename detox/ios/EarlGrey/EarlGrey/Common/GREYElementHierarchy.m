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

#import "Common/GREYElementHierarchy.h"

#import "Additions/NSObject+GREYAdditions.h"
#import "Common/GREYConstants.h"

@implementation GREYElementHierarchy

+ (NSString *)hierarchyStringForElement:(id)element {
  return [self grey_recursivePrint:element
                         withLevel:0
                      outputString:[[NSMutableString alloc] init]
           andAnnotationDictionary:nil];
}

+ (NSString *)hierarchyStringForElement:(id)element
               withAnnotationDictionary:(NSDictionary *)annotationDictionary {
  return [self grey_recursivePrint:element
                         withLevel:0
                      outputString:[[NSMutableString alloc] init]
           andAnnotationDictionary:annotationDictionary];
}

#pragma mark - Private Methods

/**
 *  Recursively prints the hierarchy from the given UI @c element along with any annotations in
 *  the @c annotationDictionary into the given @c outputString.
 *
 *  @param element The UI element to be printed.
 *  @param level The depth of the given element in the view hierarchy.
 *  @param outputString A mutable string that receives the output.
 *  @param annotationDictionary The annotations to be applied.
 *
 *  @return A string containing the full view hierarchy from the given @c element.
 */
+ (NSString *)grey_recursivePrint:(id)element
                        withLevel:(NSUInteger)level
                     outputString:(NSMutableString *)outputString
          andAnnotationDictionary:(NSDictionary *)annotationDictionary {
  NSParameterAssert(element);
  NSParameterAssert(outputString);
  // Add any annotation, if present for the view
  NSString *annotation = annotationDictionary[[NSValue valueWithNonretainedObject:element]];
  if ([outputString length] != 0) {
    [outputString appendString:@"\n"];
  }
  [outputString appendString:[self grey_printDescriptionForElement:element atLevel:level]];
  if (annotation) {
    [outputString appendString:@" "]; // Space before annotation.
    [outputString appendString:annotation];
  }
  for (id child in [self grey_orderedChildrenOf:element]) {
    [self grey_recursivePrint:child
                      withLevel:(level + 1)
                   outputString:outputString
        andAnnotationDictionary:annotationDictionary];
  }
  return outputString;
}

/**
 *  Creates and outputs the description in the correct format for the @c element at a particular @c
 *  level (depth of the element in the view hierarchy).
 *
 *  @param element The element whose description is to be printed.
 *  @param level The depth of the element in the view hierarchy.
 *
 *  @return A string with the description of the given @c element.
 */
+ (NSString *)grey_printDescriptionForElement:(id)element atLevel:(NSUInteger)level {
  NSParameterAssert(element);
  NSMutableString *printOutput = [NSMutableString stringWithString:@""];

  if (level > 0) {
    [printOutput appendString:@"  "];
    for (NSUInteger space = 0; space < level; space++) {
      if (space != level - 1) {
        [printOutput appendString:@"|  "];
      } else {
        [printOutput appendString:@"|--"];
      }
    }
  }
  [printOutput appendString:[element grey_description]];
  return printOutput;
}

/**
 *  @return An array of children of the given @c element ordered and separated for accessibility
 *          elements and de-duped.
 */
+ (NSArray *)grey_orderedChildrenOf:(id)element {
  NSMutableOrderedSet *subViewSet = [[NSMutableOrderedSet alloc] init];
  NSParameterAssert(element);

  if ([element isKindOfClass:[UIView class]]) {
    UIView *parentView = (UIView *)element;
    // Create an ordered set with all the subviews of the parent.
    subViewSet = [[NSMutableOrderedSet alloc] initWithArray:[parentView subviews]];
  }

  // Get all the children accessibility elements.
  // Check added since this runs into an infinite loop for UITableView or a UITableViewCell.
  BOOL viewIsATableViewOrCell = [element isKindOfClass:[UITableView class]]
                                    || [element isKindOfClass:[UITableViewCell class]];

  // We check here for NSNotFound since accessibilityElementCount on an NSObject without
  // an initialized accessibilityElements array throws us an NSNotFound.
  NSInteger aXElementCount = [element accessibilityElementCount];
  if (!viewIsATableViewOrCell
         && (aXElementCount > 0)
         && aXElementCount != NSNotFound) {
    if ([element isKindOfClass:[UIPickerView class]]) {
      // For a UIPickerView, we cap off all the acccessibility containers at 500, to prevent
      // a timeout searching through identical views that can go into an infinite loop.
      aXElementCount = MIN(aXElementCount, kUIPickerViewMaxAccessibilityViews);
    }

    for (NSInteger elementIndex = 0; elementIndex < aXElementCount; elementIndex++) {
      id accessibilityElement = [element accessibilityElementAtIndex:elementIndex];
      // Need to add a nil check since sometimes accessibilityElement is nil.
      if (accessibilityElement) {
        [subViewSet addObject:accessibilityElement];
      }
    }
  }
  return [subViewSet array];
}

@end
