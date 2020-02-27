//
//  XCUIElement+Visibility.h
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/23/20.
//

#import <XCTest/XCTest.h>

NS_ASSUME_NONNULL_BEGIN

@interface XCUIElement (Visibility)

@property (readonly, getter = dtx_isVisible) BOOL dtx_visible;

@end

NS_ASSUME_NONNULL_END
