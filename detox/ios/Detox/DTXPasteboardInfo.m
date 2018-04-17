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
	NSMutableDictionary *response = [[NSMutableDictionary alloc] init];
	UIPasteboard * pb = [UIPasteboard generalPasteboard];
	if (pb.hasStrings) {
		[response setValue:pb.string forKey:@"pbString"];
	}
	if (pb.hasURLs) {
		[response setValue:[NSString stringWithFormat:@"%@", pb.URL] forKey:@"pbURL"];
	}
	if (pb.hasImages) {
		[response setValue:[NSString stringWithFormat:@"%@", pb.image] forKey:@"pbImage"];
	}
	if (pb.hasColors) {
		[response setValue:[NSString stringWithFormat:@"%@", pb.color] forKey:@"pbColor"];
	}
	return response;
}

@end
