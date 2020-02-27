//
//  XCUIElement+Visibility.m
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/23/20.
//

#import "XCUIElement+Visibility.h"

@implementation XCUIElement (Visibility)

- (BOOL)dtx_isVisible
{
	return self.exists && self.isHittable && CGRectIsEmpty(self.frame) == NO;
}

@end
