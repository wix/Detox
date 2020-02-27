//
//  XCUIElement+ExtendedText.h
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/21/20.
//

#import <XCTest/XCTest.h>

NS_ASSUME_NONNULL_BEGIN

@interface XCUIElement (ExtendedText)

- (void)dtx_clearText;
- (void)dtx_replaceText:(NSString*)text;

@end

NS_ASSUME_NONNULL_END
