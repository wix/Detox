//
//  XCUIElement+ExtendedTouches.h
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 9/22/19.
//

#import <XCTest/XCTest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol DTXExtendedTouches

- (void)dtx_scrollWithOffset:(CGVector)offsetVector;
- (void)dtx_tapAtPoint:(CGVector)pointVector;

@end

@interface XCUIElement (ExtendedTouches) <DTXExtendedTouches>

@end

@interface XCUICoordinate (ExtendedTouches) <DTXExtendedTouches>

@end

NS_ASSUME_NONNULL_END
