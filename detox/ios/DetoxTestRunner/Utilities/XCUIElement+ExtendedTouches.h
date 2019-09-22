//
//  XCUIElement+ExtendedTouches.h
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 9/22/19.
//

#import <XCTest/XCTest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol DTXExtendedTouches

- (void)scrollWithOffset:(CGVector)offsetVector;

@end

@interface XCUIElement (ExtendedTouches) <DTXExtendedTouches>

- (void)tapAtPoint:(CGVector)pointVector;

@end

@interface XCUICoordinate (ExtendedTouches) <DTXExtendedTouches>

@end

NS_ASSUME_NONNULL_END
