//
//  UIImage+DetoxUtils.m
//  Detox
//
//  Created by Leo Natan on 9/13/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIImage+DetoxUtils.h"

@implementation UIImage (DetoxUtils)

- (BOOL)dtx_isTransparentEnoughWithThreshold:(CGFloat)threshold
{
	CGImageRef cgImage = self.CGImage;
	
	CFDataRef pixelData = CGDataProviderCopyData(CGImageGetDataProvider(cgImage));
	dtx_defer {
		CFRelease(pixelData);
	};
	const UInt8* data = CFDataGetBytePtr(pixelData);
	
	for (NSUInteger y = 0; y < self.size.height; y++) {
		double alphaSum = 0.0;
		for (NSUInteger x = 0; x < self.size.width; x++) {
			uint8_t alpha = data[((NSUInteger)self.size.width * y + x) * 4 + 3];
			alphaSum += (alpha / 255.0);
		}
		CGFloat avg = alphaSum / self.size.width;
		
		if(avg > threshold)
		{
			return NO;
		}
	}
	
	return YES;
}

#if DEBUG
- (void)dtx_saveToDesktop
{
	static NSURL* desktopURL;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		NSString* somePath = NSHomeDirectory();
		NSString* userPath = [somePath substringToIndex:[somePath rangeOfString:@"/Library"].location];
		desktopURL = [[NSURL fileURLWithPath:userPath] URLByAppendingPathComponent:@"Desktop"];
	});
	
	[UIImagePNGRepresentation(self) writeToURL:[desktopURL URLByAppendingPathComponent:@"view.png"] atomically:YES];
}
#endif

@end
