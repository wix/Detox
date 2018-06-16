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

+ (NSDictionary *)pasteboardInfo {
	UIPasteboard * pb = [UIPasteboard generalPasteboard];
	if (pb.hasStrings) {
		return @{@"pbString" : pb.string};
	}
	if (pb.hasURLs) {
		return  @{@"pbURL" : [NSString stringWithFormat:@"%@", pb.URL]};
	}
	if (pb.hasImages) {
		return @{@"pbImage" : [NSString stringWithFormat:@"%@", pb.image]};
	}
	if (pb.hasColors) {
		return @{@"pbColor" : [NSString stringWithFormat:@"%@", pb.color]};
	}
	return nil;
}

@end
