//
//  DTXPasteboardInfo.m
//  Detox
//
//  Created by Dmytro Ponomarenko on 4/9/18.
//  Copyright © 2018 Wix. All rights reserved.
//

#import "DTXPasteboardInfo.h"
#import <UIKit/UIKit.h>

@implementation DTXPasteboardInfo

- (BOOL)pasteboardHaveSomeValue {
	UIPasteboard * pb = [UIPasteboard generalPasteboard];
	if (pb.hasStrings) {
		return YES;
	}
	if (pb.hasURLs) {
		return YES;
	}
	if (pb.hasImages) {
		return YES;
	}
	if (pb.hasColors) {
		return YES;
	}
	return NO;
}

@end
