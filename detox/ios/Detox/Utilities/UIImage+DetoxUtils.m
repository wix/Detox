//
//  UIImage+DetoxUtils.m
//  Detox
//
//  Created by Leo Natan on 9/13/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "UIImage+DetoxUtils.h"

@implementation UIImage (DetoxUtils)

- (UIImage *)dtx_imageByCroppingInRect:(CGRect)rect
{
	rect = CGRectMake(rect.origin.x * self.scale, rect.origin.y * self.scale, rect.size.width * self.scale, rect.size.height * self.scale);
	
	return [UIImage imageWithCGImage:CGImageCreateWithImageInRect(self.CGImage, rect) scale:1 orientation:self.imageOrientation];
}

- (NSUInteger)dtx_numberOfVisiblePixelsWithAlphaThreshold:(CGFloat)threshold totalPixels:(NSUInteger*)totalPixels
{
	CGImageRef cgImage = self.CGImage;
	
	CFDataRef pixelData = CGDataProviderCopyData(CGImageGetDataProvider(cgImage));
	dtx_defer {
		CFRelease(pixelData);
	};
	const uint8_t* bytes = CFDataGetBytePtr(pixelData);
	
	size_t width  = CGImageGetWidth(cgImage);
	size_t height = CGImageGetHeight(cgImage);
	
	size_t bpr = CGImageGetBytesPerRow(cgImage);
	size_t bpp = CGImageGetBitsPerPixel(cgImage);
	size_t bpc = CGImageGetBitsPerComponent(cgImage);
	size_t bytes_per_pixel = bpp / bpc;
	
	CGImageAlphaInfo alphaInfo = CGImageGetAlphaInfo(cgImage);
	CGBitmapInfo bitmapInfo = CGImageGetBitmapInfo(cgImage);
	
	uint8_t alphaOffset;
	if(alphaInfo == kCGImageAlphaPremultipliedFirst)
	{
		if((bitmapInfo & kCGBitmapByteOrderMask) == kCGBitmapByteOrder32Little)
		{
			alphaOffset = 3;
		}
		else
		{
			alphaOffset = 0;
		}
	}
	else
	{
		if((bitmapInfo & kCGBitmapByteOrderMask) == kCGBitmapByteOrder32Little)
		{
			alphaOffset = 0;
		}
		else
		{
			alphaOffset = 3;
		}
	}
	
	NSUInteger visible = 0;
	NSUInteger total = 0;
	
	for(size_t row = 0; row < height; row++)
	{
		for(size_t col = 0; col < width; col++)
		{
			total++;
			
			const uint8_t* pixel =
			&bytes[row * bpr + col * bytes_per_pixel];
			
			uint8_t alpha255 = pixel[alphaOffset];
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

- (void)dtx_saveToPath:(NSURL*)path fileName:(NSString*)name
{
	NSURL *combinedPath = [path URLByAppendingPathComponent:name];
	[UIImagePNGRepresentation(self) writeToURL:[NSURL fileURLWithPath:combinedPath.path] atomically:YES];
}

@end
