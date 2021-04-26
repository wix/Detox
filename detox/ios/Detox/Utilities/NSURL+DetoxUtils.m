//
//  NSURL+DetoxUtils.m
//  Detox
//
//  Created by Alon Haiut on 26/04/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

#import "NSURL+DetoxUtils.h"

@implementation NSURL (DetoxUtils)

+ (NSURL *)temporaryPath:(NSString *)subFolder
{
	static NSURL* temporaryURL;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		temporaryURL = [NSURL URLWithString:NSTemporaryDirectory()];
	});
	
	return [temporaryURL URLByAppendingPathComponent:subFolder isDirectory:true];
}

+ (NSURL *)visibilityFailingScreenshotsPath
{
	return [self temporaryPath:@"visibilityFailingScreenshots"];
}

+ (NSURL *)visibilityFailingRectsPath
{
	return [self temporaryPath:@"visibilityFailingRects"];
}

@end
