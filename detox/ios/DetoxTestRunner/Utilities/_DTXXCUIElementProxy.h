//
//  _DTXXCUIElementProxy.h
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/12/20.
//

#import <Foundation/Foundation.h>
@import XCTest;

NS_ASSUME_NONNULL_BEGIN

@interface XCUIElement (ProxyExtensions)

- (void)_dtx_waitForIdleAndDisable;
- (void)_dtx_enableIdle;

@end

@interface _DTXXCUIElementProxy : NSObject

- (instancetype)initWithElement:(XCUIElement*)element;

- (void)_dtx_waitForIdleAndDisable;
- (void)_dtx_enableIdle;

@end

NS_ASSUME_NONNULL_END
