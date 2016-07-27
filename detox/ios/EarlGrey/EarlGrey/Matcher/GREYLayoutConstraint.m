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

#import "Matcher/GREYLayoutConstraint.h"

#import "Additions/NSString+GREYAdditions.h"

@implementation GREYLayoutConstraint

+ (instancetype)layoutConstraintWithAttribute:(GREYLayoutAttribute)attribute
                                    relatedBy:(GREYLayoutRelation)relation
                         toReferenceAttribute:(GREYLayoutAttribute)referenceAttribute
                                   multiplier:(CGFloat)multiplier
                                     constant:(CGFloat)constant {
  GREYLayoutConstraint *constraint = [[GREYLayoutConstraint alloc] init];
  constraint.attribute = attribute;
  constraint.relation = relation;
  constraint.referenceAttribute = referenceAttribute;
  constraint.multiplier = multiplier;
  constraint.constant = constant;
  return constraint;
}

+ (instancetype)layoutConstraintForDirection:(GREYLayoutDirection)direction
                        andMinimumSeparation:(CGFloat)separation {
  switch (direction) {
    case kGREYLayoutDirectionLeft:
      return [GREYLayoutConstraint layoutConstraintWithAttribute:kGREYLayoutAttributeRight
                                                       relatedBy:kGREYLayoutRelationLessThanOrEqual
                                            toReferenceAttribute:kGREYLayoutAttributeLeft
                                                      multiplier:1.0
                                                        constant:-separation];
    case kGREYLayoutDirectionRight:
      return [GREYLayoutConstraint layoutConstraintWithAttribute:kGREYLayoutAttributeLeft
                                                       relatedBy:kGREYLayoutRelationGreaterThanOrEqual
                                            toReferenceAttribute:kGREYLayoutAttributeRight
                                                      multiplier:1.0
                                                        constant:separation];
    case kGREYLayoutDirectionUp:
      return [GREYLayoutConstraint layoutConstraintWithAttribute:kGREYLayoutAttributeBottom
                                                       relatedBy:kGREYLayoutRelationLessThanOrEqual
                                            toReferenceAttribute:kGREYLayoutAttributeTop
                                                      multiplier:1.0
                                                        constant:-separation];
    case kGREYLayoutDirectionDown:
      return [GREYLayoutConstraint layoutConstraintWithAttribute:kGREYLayoutAttributeTop
                                                       relatedBy:kGREYLayoutRelationGreaterThanOrEqual
                                            toReferenceAttribute:kGREYLayoutAttributeBottom
                                                      multiplier:1.0
                                                        constant:separation];
  }
}

- (BOOL)satisfiedByElement:(id)element andReferenceElement:(id)referenceElement {
  CGFloat value1 = [GREYLayoutConstraint grey_attribute:self.attribute ofElement:element];
  CGFloat value2 = [GREYLayoutConstraint grey_attribute:self.referenceAttribute
                                              ofElement:referenceElement];
  return [GREYLayoutConstraint grey_value:value1
                                relatedBy:self.relation
                                  toValue:value2 * self.multiplier + self.constant];
}

- (NSString *)description {
  return [NSString stringWithFormat:@"Constraint: %@ %@ %@ * %g + %g",
             NSStringFromGREYLayoutAttribute(self.attribute),
             NSStringFromGREYLayoutRelation(self.relation),
             NSStringFromGREYLayoutAttribute(self.referenceAttribute),
             self.multiplier,
             self.constant];
}

#pragma mark - Private

// Returns the attribute value for the given element.
+ (CGFloat)grey_attribute:(GREYLayoutAttribute)attribute ofElement:(id)element {
  NSParameterAssert(element);
  CGRect rect = [element accessibilityFrame];
  switch (attribute) {
    case kGREYLayoutAttributeTop: return CGRectGetMinY(rect);
    case kGREYLayoutAttributeBottom: return CGRectGetMaxY(rect);
    case kGREYLayoutAttributeLeft: return CGRectGetMinX(rect);
    case kGREYLayoutAttributeRight: return CGRectGetMaxX(rect);
  }
}

// Compares the given values and returns a BOOL that indicates whether the |relation| was
// satisfied (YES) or not satisified (NO).
+ (BOOL)grey_value:(CGFloat)value
         relatedBy:(GREYLayoutRelation)relation
           toValue:(CGFloat)anotherValue {
  switch (relation) {
    case kGREYLayoutRelationEqual: return value == anotherValue;
    case kGREYLayoutRelationGreaterThanOrEqual: return value >= anotherValue;
    case kGREYLayoutRelationLessThanOrEqual: return value <= anotherValue;
  }
}

@end
