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

#import <EarlGrey/CGGeometry+GREYAdditions.h>

#import "GREYBaseTest.h"

@interface CGGeometry_GREYAdditionsTest : GREYBaseTest
@end

@implementation CGGeometry_GREYAdditionsTest

// Always run in portrait mode.
- (void)testCGRectFixedToVariableCoordinates {
  CGRect expectedRect = CGRectMake(10, 20, 15, 30);
  CGRect actualRect = CGRectFixedToVariableScreenCoordinates(CGRectMake(10, 20, 15, 30));
  XCTAssertTrue(CGRectEqualToRect(expectedRect, actualRect));
}

// Always run in portrait mode.
- (void)testCGRectVariableToFixedCoordinates {
  CGRect expectedRect = CGRectMake(10, 20, 15, 30);
  CGRect actualRect = CGRectVariableToFixedScreenCoordinates(CGRectMake(10, 20, 15, 30));
  XCTAssertTrue(CGRectEqualToRect(expectedRect, actualRect));
}

- (void)testCGRectPointToPixel {
  CGFloat scale = [UIScreen mainScreen].scale;
  CGRect expectedRect = CGRectMake(10 * scale, 22 * scale, 12 * scale, 11.5f * scale);
  CGRect actualRect = CGRectPointToPixel(CGRectMake(10, 22, 12, 11.5f));
  XCTAssertTrue(CGRectEqualToRect(expectedRect, actualRect));
}

- (void)testCGRectPixelToPoint {
  CGFloat scale = [UIScreen mainScreen].scale;
  CGRect actualRect = CGRectPixelToPoint(CGRectMake(10, 22, 12, 11.5f));
  XCTAssertEqualWithAccuracy(10 / scale, actualRect.origin.x, 0.005);
  XCTAssertEqualWithAccuracy(22 / scale, actualRect.origin.y, 0.005);
  XCTAssertEqualWithAccuracy(12 / scale, actualRect.size.width, 0.005);
  XCTAssertEqualWithAccuracy(11.5f / scale, actualRect.size.height, 0.005);
}

- (void)testCGRectIntegralInside {
  CGRect rect1 = CGRectMake(10, 10, 20, 20);
  XCTAssertTrue(CGRectEqualToRect(CGRectMake(10, 10, 20, 20),
                                  CGRectIntegralInside(rect1)));

  CGRect rect2 = CGRectMake(10.5, 10, 20, 20);
  XCTAssertTrue(CGRectEqualToRect(CGRectMake(11, 10, 19, 20),
                                  CGRectIntegralInside(rect2)));

  CGRect rect3 = CGRectMake(10.5, 10.5, 20, 20);
  XCTAssertTrue(CGRectEqualToRect(CGRectMake(11, 11, 19, 19),
                                  CGRectIntegralInside(rect3)));

  CGRect rect4 = CGRectMake(10.5, 10.5, 1, 1);
  XCTAssertTrue(CGRectEqualToRect(CGRectMake(11, 11, 1, 1),
                                  CGRectIntegralInside(rect4)));

  CGRect rect5 = CGRectMake(10.5f, 10.5f, 1.51f, 1.51f);
  XCTAssertTrue(CGRectEqualToRect(CGRectMake(11, 11, 1, 1),
                                  CGRectIntegralInside(rect5)));

  CGRect rect6 = CGRectMake(10.2f, 10.88f, 1, 2);
  XCTAssertTrue(CGRectEqualToRect(CGRectMake(11, 11, 1, 1),
                                  CGRectIntegralInside(rect6)));

  CGRect rect7 = CGRectMake(11.99f, 10.2f, 1.1f, 2.8f);
  XCTAssertTrue(CGRectEqualToRect(CGRectMake(12, 11, 1, 2),
                                  CGRectIntegralInside(rect7)));

  CGRect rect8 = CGRectMake(5, 5, 0.4f, 0.5f);
  XCTAssertTrue(CGRectEqualToRect(CGRectMake(5, 5, 0, 0),
                                  CGRectIntegralInside(rect8)));

  CGRect rect9 = CGRectMake(5, 5, 1.51f, 0.5f);
  XCTAssertTrue(CGRectEqualToRect(CGRectMake(5, 5, 2, 0),
                                  CGRectIntegralInside(rect9)));

  CGRect rect10 = CGRectMake(5, 5, 1.5f, 1.51f);
  XCTAssertTrue(CGRectEqualToRect(CGRectMake(5, 5, 1, 2),
                                  CGRectIntegralInside(rect10)));

  CGRect rect11 = CGRectMake(1.5f, 1.5f, 1.5f, 1.5f);
  XCTAssertTrue(CGRectEqualToRect(CGRectMake(2, 2, 1, 1),
                                  CGRectIntegralInside(rect11)));
}

- (void)testCGPointAfterRemovingFractionalPixelsRoundedDown {
  CGFloat scale = [UIScreen mainScreen].scale;
  CGPoint expected = CGPointMake(1.0f / scale, 1.0f / scale);
  CGPoint actual = CGPointAfterRemovingFractionalPixels(CGPointMake(1.1f / scale, 1.5f / scale));
  XCTAssertTrue(CGPointEqualToPoint(expected, actual));
}

- (void)testCGPointAfterRemovingFractionalPixelsRoundedUp {
  CGFloat scale = [UIScreen mainScreen].scale;
  CGPoint expected = CGPointMake(-1.0f / scale, 1.0f / scale);
  CGPoint actual = CGPointAfterRemovingFractionalPixels(CGPointMake(-1.4f / scale, 0.51f / scale));
  XCTAssertTrue(CGPointEqualToPoint(expected, actual));
}

- (void)testCGFloatAfterRemovingFractionalPixels {
  CGFloat scale = [UIScreen mainScreen].scale;

  XCTAssertEqual(1.0f / scale, CGFloatAfterRemovingFractionalPixels(1.0f / scale));
  XCTAssertEqual(1.0f / scale, CGFloatAfterRemovingFractionalPixels(1.1f / scale));
  XCTAssertEqual(2.0f / scale, CGFloatAfterRemovingFractionalPixels(1.8f / scale));
  XCTAssertEqual(2.0f / scale, CGFloatAfterRemovingFractionalPixels(1.51f / scale));
  XCTAssertEqual(-1.0f / scale, CGFloatAfterRemovingFractionalPixels(-1.5f / scale));
  XCTAssertEqual(-2.0f / scale, CGFloatAfterRemovingFractionalPixels(-1.51f / scale));
  XCTAssertEqual(.0f, CGFloatAfterRemovingFractionalPixels(0.4f / scale));
  XCTAssertEqual(.0f, CGFloatAfterRemovingFractionalPixels(-0.4f / scale));
  XCTAssertEqual(1.0f / scale, CGFloatAfterRemovingFractionalPixels(0.51f / scale));
  XCTAssertEqual(-1.0f / scale, CGFloatAfterRemovingFractionalPixels(-0.51f / scale));
}

- (void)expectCGVectorFromEndPointsToReturn:(CGVector)expected
                             withStartPoint:(CGPoint)startPoint
                                   endPoint:(CGPoint)endPoint
                               isNormalized:(BOOL)isNormalized {
  CGVector actual = CGVectorFromEndPoints(startPoint, endPoint, isNormalized);
  XCTAssertEqualWithAccuracy(actual.dx, expected.dx, 0.0001f);
  XCTAssertEqualWithAccuracy(actual.dy, expected.dy, 0.0001f);
}

- (void)testCGVectorFromEndPointsWorksForOrigin {
  const CGVector cgVectorZero = CGVectorMake(0, 0);
  [self expectCGVectorFromEndPointsToReturn:cgVectorZero
                             withStartPoint:CGPointZero
                                   endPoint:CGPointZero
                               isNormalized:YES];
  [self expectCGVectorFromEndPointsToReturn:cgVectorZero
                             withStartPoint:CGPointZero
                                   endPoint:CGPointZero
                               isNormalized:NO];
}

- (void)testCGVectorFromEndPointsWorksForNegativeCoordinates {
  CGPoint start = CGPointMake(-10, -20);
  CGPoint end = CGPointMake(-12, -18);
  // Expected normalized vector is (-√2/2, √2/2).
  [self expectCGVectorFromEndPointsToReturn:CGVectorMake((CGFloat)(-sqrt(2.0) / 2.0),
                                                         (CGFloat)(sqrt(2.0) / 2.0))
                             withStartPoint:start
                                   endPoint:end
                               isNormalized:YES];

}

- (void)testCGVectorFromEndPointsWorksForZeroLength {
  const CGVector cgVectorZero = CGVectorMake(0, 0);
  CGPoint aPoint = CGPointMake(10, 20);
  [self expectCGVectorFromEndPointsToReturn:cgVectorZero
                             withStartPoint:aPoint
                                   endPoint:aPoint
                               isNormalized:YES];
  [self expectCGVectorFromEndPointsToReturn:cgVectorZero
                             withStartPoint:aPoint
                                   endPoint:aPoint
                               isNormalized:NO];
}

- (void)testCGVectorFromEndPointsWorksForNonZeroLength {
  CGPoint aPoint = CGPointMake(10, 20);
  CGPoint anotherPoint = CGPointMake(12, 18);
  // Expected vector is (2, -2).
  [self expectCGVectorFromEndPointsToReturn:CGVectorMake(2, -2)
                             withStartPoint:aPoint
                                   endPoint:anotherPoint
                               isNormalized:NO];
  // Expected normalized vector is (√2/2, -√2/2).
  [self expectCGVectorFromEndPointsToReturn:CGVectorMake((CGFloat)(sqrt(2.0) / 2.0),
                                                         (CGFloat)(-sqrt(2.0) / 2.0))
                             withStartPoint:aPoint
                                   endPoint:anotherPoint
                               isNormalized:YES];
}

- (void)testCGPointIsNull {
  XCTAssertFalse(CGPointIsNull(CGPointMake(0, 0)), @"Point at {0,0} is not null.");
  XCTAssertTrue(CGPointIsNull(CGPointMake(0, NAN)), @"Point at {0,NAN} is null.");
  XCTAssertTrue(CGPointIsNull(CGPointMake(NAN, 0)), @"Point at {NAN,0} is null.");
  XCTAssertTrue(CGPointIsNull(CGPointMake(NAN, NAN)), @"Point at {NAN,NAN} is null.");
}

@end
