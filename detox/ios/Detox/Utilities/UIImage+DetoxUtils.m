//
//  UIImage+DetoxUtils.m
//  Detox
//
//  Created by Leo Natan on 9/13/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIImage+DetoxUtils.h"

@implementation UIImage (DetoxUtils)

- (NSUInteger)dtx_numberOfVisiblePixelsWithThreshold:(CGFloat)threshold totalPixels:(NSUInteger*)totalPixels
{
	CGImageRef cgImage = self.CGImage;
	
	CFDataRef pixelData = CGDataProviderCopyData(CGImageGetDataProvider(cgImage));
	dtx_defer {
		CFRelease(pixelData);
	};
	const UInt8* data = CFDataGetBytePtr(pixelData);
	
	NSUInteger visible = 0;
	NSUInteger total = 0;
	
	for (NSUInteger y = 0; y < self.size.height; y++) {
		for (NSUInteger x = 0; x < self.size.width; x++) {
			total++;
			uint8_t alpha255 = data[((NSUInteger)self.size.width * y + x) * 4 + 3];
			CGFloat alpha = alpha255 / 255.0;
			if(alpha < threshold)
			{
				visible++;
			}
		}
	}
	
	if(totalPixels != NULL)
	{
		*totalPixels = total;
	}
	
	return visible;
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
