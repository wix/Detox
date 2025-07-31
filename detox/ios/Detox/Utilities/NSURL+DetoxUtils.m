//
//  NSURL+DetoxUtils.m
//  Detox
//
//  Created by Alon Haiut on 26/04/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

#import "NSURL+DetoxUtils.h"

static NSURL* __artifactsRootURL;

@implementation NSURL (DetoxUtils)

+ (void)dtx_setArtifactsRootURL:(NSURL *)url
{
	__artifactsRootURL = url;
}

+ (NSURL *)dtx_artifactsRootURL
{
	return __artifactsRootURL;
}

+ (NSURL *)temporaryPath:(NSString *)subFolder
{
	if(__artifactsRootURL)
	{
		return __artifactsRootURL;
	}

	static NSURL* temporaryURL;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		temporaryURL = [NSURL fileURLWithPath:NSTemporaryDirectory()];
	});

	NSURL* directoryPath = [temporaryURL URLByAppendingPathComponent:subFolder isDirectory:true];
	NSError * error = nil;
	[[NSFileManager defaultManager] createDirectoryAtPath:directoryPath.path
							  withIntermediateDirectories:YES
											   attributes:nil
													error:&error];
	if (error != nil) {
		NSLog(@"Error creating %@ directory under tmp directory: %@", subFolder, error);
	}

	return directoryPath;
}

+ (NSURL *)visibilityFailingScreenshotsPath
{
	if(__artifactsRootURL)
	{
		return __artifactsRootURL;
	}

	return [self temporaryPath:@"visibilityFailingScreenshots"];
}

+ (NSURL *)visibilityFailingRectsPath
{
	if(__artifactsRootURL)
	{
		return __artifactsRootURL;
	}

	return [self temporaryPath:@"visibilityFailingRects"];
}

+ (NSURL *)elementsScreenshotPath
{
	return [self temporaryPath:@"elementsScreenshot"];
}

+ (NSURL *)testFailedArtifactsPath
{
	return [self temporaryPath:@"detox.artifacts"];
}

@end
