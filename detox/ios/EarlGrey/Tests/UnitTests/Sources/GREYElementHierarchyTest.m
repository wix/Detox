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

#import <EarlGrey/GREYElementHierarchy.h>

#import <OCMock/OCMock.h>

#import "GREYBaseTest.h"

const CGRect kTestRect = { { 0.0f, 0.0f }, { 10.0f, 10.0f } };

@interface GREYUTCustomAccessibilityView : UIView

@property(nonatomic, strong) NSArray *accessibleElements;

- (id)initWithObjects:(NSArray *)objectArray;

// UIAccessibilityContainer methods
- (NSInteger)accessibilityElementCount;
- (id)accessibilityElementAtIndex:(NSInteger)index;
- (NSInteger)indexOfAccessibilityElement:(id)element;
@end

@implementation GREYUTCustomAccessibilityView

- (id)initWithObjects:(NSArray *)objectArray {
  self = [super init];
  if (self) {
    self.accessibleElements = objectArray;
  }
  return(self);
}

#pragma mark - UIAccessibilityContainer Protocol

- (NSInteger)accessibilityElementCount {
  return (NSInteger)[[self accessibleElements] count];
}

- (id)accessibilityElementAtIndex:(NSInteger)index {
  return [[self accessibleElements] objectAtIndex:(NSUInteger)index];
}

- (NSInteger)indexOfAccessibilityElement:(id)element {
  return (NSInteger)[[self accessibleElements] indexOfObject:element];
}

@end

@interface GREYElementHierarchyTest : GREYBaseTest

@end

@implementation GREYElementHierarchyTest

- (void)testSortedChildViewsForNilView {
  UIView *view = nil;
  XCTAssertThrows([GREYElementHierarchy grey_orderedChildrenOf:view]);
}

- (void)testSortedChildViewsForNilCustomView {
  GREYUTCustomAccessibilityView *view = nil;
  XCTAssertThrows([GREYElementHierarchy grey_orderedChildrenOf:view]);
}

- (void)testSortedChildViewsForViewWithSingleSubview {
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewB = [[UIView alloc] initWithFrame:kTestRect];

  [viewA accessibilityElementCount];
  [viewA addSubview:viewB];
  NSArray *orderedViews = @[viewB];
  XCTAssertEqualObjects([GREYElementHierarchy grey_orderedChildrenOf:viewA], orderedViews);
}

- (void)testSortedChildViewsForViewWithSubviews {
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewB = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewC = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewD = [[UIView alloc] initWithFrame:kTestRect];
  [viewA addSubview:viewB];
  [viewA addSubview:viewC];
  [viewA addSubview:viewD];
  NSArray *orderedViews = @[ viewB, viewC, viewD ];
  XCTAssertEqualObjects([GREYElementHierarchy grey_orderedChildrenOf:viewA], orderedViews);
}

- (void)testSortedChildViewsForCustomViewWithSubviews {
  GREYUTCustomAccessibilityView *viewA =
      [[GREYUTCustomAccessibilityView alloc] initWithFrame:kTestRect];
  UIView *viewB = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewC = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewD = [[UIView alloc] initWithFrame:kTestRect];
  [viewA addSubview:viewB];
  [viewA addSubview:viewC];
  [viewA addSubview:viewD];
  NSArray *orderedViews = @[ viewB, viewC, viewD ];
  XCTAssertEqualObjects([GREYElementHierarchy grey_orderedChildrenOf:viewA], orderedViews);
}

- (void)testSortedChildViewsForCustomViewWithAXViews {
  UIView *viewB = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewC = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewD = [[UIView alloc] initWithFrame:kTestRect];
  GREYUTCustomAccessibilityView *viewA = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[ viewB, viewC, viewD ]];
  NSArray *orderedViews = @[ viewB, viewC, viewD ];
  XCTAssertEqualObjects([GREYElementHierarchy grey_orderedChildrenOf:viewA], orderedViews);
}

- (void)testSortedChildViewsForCustomViewWithSingleAXView {
  UIView *viewB = [[UIView alloc] initWithFrame:kTestRect];
  GREYUTCustomAccessibilityView *viewA = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[viewB]];
  NSArray *orderedViews = @[viewB];
  XCTAssertEqualObjects([GREYElementHierarchy grey_orderedChildrenOf:viewA], orderedViews);
}

- (void)testSortedChildViewsForCustomViewWithBothSubViewsAndAXViews {
  UIView *viewB = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewC = [[UIView alloc] initWithFrame:kTestRect];
  GREYUTCustomAccessibilityView *viewA = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[viewB, viewC]];
  UIView *viewD = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewE = [[UIView alloc] initWithFrame:kTestRect];
  [viewA addSubview:viewD];
  [viewA addSubview:viewE];
  NSArray *orderedViews = @[viewD, viewE, viewB, viewC];
  XCTAssertEqualObjects([GREYElementHierarchy grey_orderedChildrenOf:viewA], orderedViews);
}

- (void)testSortedChildViewsForViewWithATableViewCellAsASubview {
  UITableViewCell *cell = [[UITableViewCell alloc] init];
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  [cell addSubview:viewA];

  // Pre-iOS 8, UITableViewCell holds its views in an internal subview.
  NSArray *children = iOS8_0_OR_ABOVE() ? [GREYElementHierarchy grey_orderedChildrenOf:cell] :
  [GREYElementHierarchy grey_orderedChildrenOf:[cell.subviews objectAtIndex:0]];

  XCTAssertTrue([children containsObject:viewA]);
  XCTAssertTrue([children containsObject:viewA],
                @"View to look for: %@\nList: %@", viewA, children);
}

- (void)testSortedChildViewsForViewWithATableViewCellAsAnAXView {
  UITableViewCell *cell = [[UITableViewCell alloc] init];
  GREYUTCustomAccessibilityView *viewA =
      [[GREYUTCustomAccessibilityView alloc] initWithObjects:@[ cell ]];
  id firstObject = [[GREYElementHierarchy grey_orderedChildrenOf:viewA] firstObject];
  XCTAssertEqualObjects(firstObject, cell);
}

- (void)testHierarchyStringWithNilView {
  UIView *view = nil;
  XCTAssertThrows([GREYElementHierarchy hierarchyStringForElement:view]);
}

- (void)testHierarchyStringWithValidHierarchy {
  UIView *viewB = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewC = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewD = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewE = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewF = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewG = [[UIView alloc] initWithFrame:kTestRect];
  GREYUTCustomAccessibilityView *viewA = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[ viewD, viewE ]];
  [viewA addSubview:viewB];
  [viewA addSubview:viewC];
  [viewB addSubview:viewF];
  [viewE addSubview:viewG];

  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA];
  NSArray *stringTargetHierarchy = @[ @"<GREYUTCustomAccessibilityView:",
                                        @"  |--<UIView:",
                                        @"  |  |--<UIView:" ];
  for (NSString *targetString in stringTargetHierarchy) {
    XCTAssertTrue([stringHierarchy rangeOfString:targetString].location != NSNotFound);
  }
}

- (void)testHierarchyStringWithSingleView {
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA];
  NSArray *stringTargetHierarchy = @[ @"<UIView:" ];
  for (NSString *targetString in stringTargetHierarchy) {
    XCTAssertTrue([stringHierarchy rangeOfString:targetString].location != NSNotFound);
  }
}

- (void)testHierarchyStringWithSubviews {
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewB = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewC = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewD = [[UIView alloc] initWithFrame:kTestRect];
  [viewA addSubview:viewB];
  [viewA addSubview:viewC];
  [viewA addSubview:viewD];
  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA];
  NSArray *stringTargetHierarchy = @[ @"<UIView:",
                                        @"  |--<UIView:"];
  for (NSString *targetString in stringTargetHierarchy) {
    XCTAssertTrue([stringHierarchy rangeOfString:targetString].location != NSNotFound);
  }
}

- (void)testHierarchyStringWithAccessibilityViews {
  UIView *viewB = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewC = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewD = [[UIView alloc] initWithFrame:kTestRect];
  GREYUTCustomAccessibilityView *viewA = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[ viewB, viewC, viewD ]];
  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA];
  NSArray *stringTargetHierarchy = @[ @"<GREYUTCustomAccessibilityView:",
                                        @"  |--<UIView:"];
  for (NSString *targetString in stringTargetHierarchy) {
    XCTAssertTrue([stringHierarchy rangeOfString:targetString].location != NSNotFound);
  }
}

- (void)testStringForCascadingHierarchyWithBothSubviewsandAXViews {
  UIView *viewB = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewD = [[UIView alloc] initWithFrame:kTestRect];
  GREYUTCustomAccessibilityView *viewC = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[ viewD ]];
  GREYUTCustomAccessibilityView *viewA = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[ viewB ]];
  [viewB addSubview:viewC];
  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA];
  NSArray *stringTargetHierarchy = @[ @"<GREYUTCustomAccessibilityView:",
                                        @"  |--<UIView:",
                                        @"  |  |--<GREYUTCustomAccessibilityView:",
                                        @"  |  |  |--<UIView:" ];
  for (NSString *targetString in stringTargetHierarchy) {
    XCTAssertTrue([stringHierarchy rangeOfString:targetString].location != NSNotFound);
  }
}

- (void)testPrintingOfDescriptionAtLevelZero {
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  NSString *targetString = @"<UIView:";
  NSString *printSubstring = [GREYElementHierarchy grey_printDescriptionForElement:viewA
                                                                           atLevel:0];
  XCTAssert([[printSubstring substringToIndex:[targetString length]] isEqualToString:targetString]);
}

- (void)testPrintingOfDescriptionAtLevelOne {
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  NSString *targetString = @"  |--<UIView:";
  NSString *printSubstring = [GREYElementHierarchy grey_printDescriptionForElement:viewA
                                                                           atLevel:1];
  XCTAssert([[printSubstring substringToIndex:[targetString length]] isEqualToString:targetString]);
}

- (void)testPrintingOfDescriptionAtLevelTwo {
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  NSString *targetString = @"  |  |--<UIView:";
  NSString *printSubstring = [GREYElementHierarchy grey_printDescriptionForElement:viewA
                                                                           atLevel:2];
  XCTAssert([[printSubstring substringToIndex:[targetString length]] isEqualToString:targetString]);
}

- (void)testAnnotationsForNilDictionary {
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA
                                                     withAnnotationDictionary:nil];
  XCTAssertNotNil(stringHierarchy);
}

- (void)testAnnotationsForSingleView {
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  NSString *viewAAnnotation = @"This is a UIView";
  NSDictionary *annotations = @{[NSValue valueWithNonretainedObject:viewA] : viewAAnnotation};
  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA
                                                     withAnnotationDictionary:annotations];
  XCTAssertTrue([stringHierarchy rangeOfString:viewAAnnotation].location != NSNotFound);
}

- (void)testAnnotationsForSingleAXView {
  GREYUTCustomAccessibilityView *viewA =
      [[GREYUTCustomAccessibilityView alloc] initWithObjects:@[]];
  NSString *viewAAnnotation = @"This is a Custom AX View";
  NSDictionary *annotations = @{[NSValue valueWithNonretainedObject:viewA] : viewAAnnotation};
  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA
                                                     withAnnotationDictionary:annotations];
  XCTAssertTrue([stringHierarchy rangeOfString:viewAAnnotation].location != NSNotFound);
}

- (void)testAnnotationsForMultipleViews {
  UIView *viewB = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewC = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewD = [[UIView alloc] initWithFrame:kTestRect];
  GREYUTCustomAccessibilityView *viewA = [[GREYUTCustomAccessibilityView alloc]
                                       initWithObjects:@[ viewB, viewC ]];
  [viewC addSubview:viewD];
  NSString *viewAAnnotation = @"This is the root AX |view| A";
  NSString *viewBAnnotation = @"This is a child of A called B";
  NSString *viewCAnnotation = @"This is a child of A called C";
  NSString *viewDAnnotation = @"This is a child of C called D";

  NSDictionary *annotations = @{ [NSValue valueWithNonretainedObject:viewA] : viewAAnnotation,
                                 [NSValue valueWithNonretainedObject:viewB] : viewBAnnotation,
                                 [NSValue valueWithNonretainedObject:viewC] : viewCAnnotation,
                                 [NSValue valueWithNonretainedObject:viewD] : viewDAnnotation };
  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA
                                                     withAnnotationDictionary:annotations];
  for (NSString *targetString in [annotations allValues]) {
    XCTAssertTrue([stringHierarchy rangeOfString:targetString].location != NSNotFound);
  }
}

- (void)testHierarchyStringForANilAnnotationDictionary {
  NSString *test =
      [GREYElementHierarchy grey_recursivePrint:[[UIView alloc] initWithFrame:kTestRect]
                                      withLevel:0
                                   outputString:[[NSMutableString alloc] init]
                        andAnnotationDictionary:nil];
  XCTAssertNotNil(test);
}

- (void)testHierarchyStringForANilView {
  XCTAssertThrows([GREYElementHierarchy grey_recursivePrint:nil
                                                  withLevel:0
                                               outputString:[[NSMutableString alloc] init]
                                    andAnnotationDictionary:nil]);
}

- (void)testHierarchyStringForANilString {
  XCTAssertThrows([GREYElementHierarchy grey_recursivePrint:nil
                                                  withLevel:0
                                               outputString:nil
                                    andAnnotationDictionary:nil]);
}

- (void)testHierarchyStringForAGarbageStartLevel {
  XCTAssertThrows([GREYElementHierarchy grey_recursivePrint:nil
                                                  withLevel:NSNotFound
                                               outputString:nil
                                    andAnnotationDictionary:nil]);
}

- (void)testHierarchyStringForSingleAccessibilityElement {
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  UIAccessibilityElement *element = [[UIAccessibilityElement alloc]
                                     initWithAccessibilityContainer:viewA];
  NSString *accessibilityIdentifier = @"AxElement";
  element.accessibilityIdentifier = accessibilityIdentifier;
  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:element
                                                     withAnnotationDictionary:nil];
  XCTAssert([stringHierarchy rangeOfString:@"<UIAccessibilityElement:"].length != NSNotFound);
  NSString *targetString =
      [NSString stringWithFormat:@"<UIAccessibilityElement:%p; AX=Y; AX.id='AxElement'; "
                                 @"AX.frame={{0, 0}, {0, 0}}; AX.activationPoint={0, 0}; "
                                 @"AX.traits='UIAccessibilityTraitNone'; AX.focused='N'>",
                                 element];
  XCTAssertEqualObjects(targetString, stringHierarchy);
}

- (void)testHierarchyStringForViewWithAccessibilityElement {
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  GREYUTCustomAccessibilityView *viewB =
      [[GREYUTCustomAccessibilityView alloc] initWithFrame:kTestRect];
  UIAccessibilityElement *element =
      [[UIAccessibilityElement alloc] initWithAccessibilityContainer:viewB];
  element.isAccessibilityElement = YES;

  [viewA addSubview:viewB];
  viewB.accessibleElements = @[ element ];

  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA
                                                     withAnnotationDictionary:nil];

  NSArray *stringTargetHierarchy = @[ @"<UIView:",
                                        @"  |--<GREYUTCustomAccessibilityView:",
                                        @"  |--<UIAccessibilityElement:" ];

  for (NSString *targetString in stringTargetHierarchy) {
    NSUInteger foundLocation = [stringHierarchy rangeOfString:targetString].location;
    XCTAssertNotEqual(foundLocation, (NSUInteger)NSNotFound);
  }
}

- (void)testHierarchyStringForViewWithAccessibilityElementsAndSubviews {
  UIView *viewForElementA = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewForElementB = [[UIView alloc] initWithFrame:kTestRect];
  UIAccessibilityElement *elementA = [[UIAccessibilityElement alloc]
                                          initWithAccessibilityContainer:viewForElementA];
  UIAccessibilityElement *elementB = [[UIAccessibilityElement alloc]
                                        initWithAccessibilityContainer:viewForElementB];
  UIView *viewA = [[UIView alloc] initWithFrame:kTestRect];
  GREYUTCustomAccessibilityView *viewB = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[ elementA ]];
  GREYUTCustomAccessibilityView *viewC = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[ elementB ]];
  UIView *viewD = [[UIView alloc] initWithFrame:kTestRect];
  [viewA addSubview:viewB];
  [viewA addSubview:viewC];
  [viewC addSubview:viewD];

  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA
                                                     withAnnotationDictionary:nil];
  NSArray *stringTargetHierarchy = @[ @"<UIView:",
                                        @"  |--<UIView:",
                                        @"  |--<GREYUTCustomAccessibilityView:",
                                        @"  |  |--<UIAccessibilityElement:" ];

  for (NSString *targetString in stringTargetHierarchy) {
    XCTAssert([stringHierarchy rangeOfString:targetString].location != NSNotFound);
  }
}

- (void)testHierarchyStringForViewWithCascadingAXElements {
  UIView *viewForElementA = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewForElementB = [[UIView alloc] initWithFrame:kTestRect];
  UIView *viewForElementC = [[UIView alloc] initWithFrame:kTestRect];
  UIAccessibilityElement *elementA = [[UIAccessibilityElement alloc]
                                          initWithAccessibilityContainer:viewForElementA];
  UIAccessibilityElement *elementB = [[UIAccessibilityElement alloc]
                                          initWithAccessibilityContainer:viewForElementB];
  UIAccessibilityElement *elementC = [[UIAccessibilityElement alloc]
                                          initWithAccessibilityContainer:viewForElementC];

  GREYUTCustomAccessibilityView *viewC = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[ elementC ]];
  GREYUTCustomAccessibilityView *viewB = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[ viewC, elementB ]];
  GREYUTCustomAccessibilityView *viewA = [[GREYUTCustomAccessibilityView alloc]
                                        initWithObjects:@[ viewB, elementA ]];

  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:viewA
                                                     withAnnotationDictionary:nil];
  NSArray *stringTargetHierarchy = @[ @"<GREYUTCustomAccessibilityView:",
                                        @"<UIAccessibilityElement:",
                                        @"  |--<GREYUTCustomAccessibilityView:",
                                        @"  |--<UIAccessibilityElement:",
                                        @"  |  |--<GREYUTCustomAccessibilityView:",
                                        @"  |  |--<UIAccessibilityElement:" ];

  for (NSString *targetString in stringTargetHierarchy) {
    XCTAssert([stringHierarchy rangeOfString:targetString].location != NSNotFound);
  }
}

- (void)testHierarchyStringForAXViewWithAnnotations {
  UIView *viewForElementA = [[UIView alloc] initWithFrame:kTestRect];
  UIAccessibilityElement *elementA = [[UIAccessibilityElement alloc]
                                      initWithAccessibilityContainer:viewForElementA];
  NSString *elementAAnnotation = @"This is Accessibility Element A";
  NSDictionary *annotations = @{ [NSValue valueWithNonretainedObject:elementA] :
                                     elementAAnnotation };
  NSString *stringHierarchy = [GREYElementHierarchy hierarchyStringForElement:elementA
                                                     withAnnotationDictionary:annotations];
  NSString *targetString =
      [NSString stringWithFormat:@"<UIAccessibilityElement:%p; AX=Y; "
                                 @"AX.frame={{0, 0}, {0, 0}}; AX.activationPoint={0, 0}; "
                                 @"AX.traits='UIAccessibilityTraitNone'; AX.focused='N'> "
                                 @"This is Accessibility Element A", elementA];
  XCTAssertEqualObjects(targetString, stringHierarchy);

}

- (void)testDumpUIHierarchyForWindow {
  UIWindow *window = [[UIWindow alloc] init];
  UIView *view = [[UIView alloc] init];
  UIImageView *imageView = [[UIImageView alloc] init];
  [view addSubview:imageView];
  [window addSubview:view];
  NSString *uiHierarchy = [GREYElementHierarchy hierarchyStringForElement:window];
  NSString *uiViewCustomPrefix = [NSString stringWithFormat:@"<UIView:%p; AX=N;", view];
  NSString *imgViewCustomPrefix = [NSString stringWithFormat:@"<UIImageView:%p; AX=N;", imageView];

  XCTAssertNotEqual([uiHierarchy rangeOfString:uiViewCustomPrefix].location,
                    (NSUInteger)NSNotFound);
  XCTAssertNotEqual([uiHierarchy rangeOfString:imgViewCustomPrefix].location,
                    (NSUInteger)NSNotFound);
}

@end
