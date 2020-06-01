//
//  DTXDurationFormatter.m
//  Detox
//
//  Created by Leo Natan (Wix) on 6/1/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "DTXDurationFormatter.h"

@implementation DTXDurationFormatter
{
	NSNumberFormatter* _numberFormatter;
}

- (instancetype)init
{
	self = [super init];
	if(self)
	{
		_numberFormatter = [NSNumberFormatter new];
		_numberFormatter.maximumFractionDigits = 2;
	}
	
	return self;
}

- (NSString*)_usStringFromTimeInterval:(NSTimeInterval)ti
{
	return [NSString stringWithFormat:@"%@μs", [_numberFormatter stringFromNumber:@(ti * 1000000)]];
}

- (NSString*)_msStringFromTimeInterval:(NSTimeInterval)ti round:(BOOL)roundMs
{
	ti *= 1000;
	if(roundMs)
	{
		ti = round(ti);
	}
	
	return [NSString stringWithFormat:@"%@ms", [_numberFormatter stringFromNumber:@(ti)]];
}

- (NSString*)_hmsmsStringFromTimeInterval:(NSTimeInterval)ti
{
	NSMutableString* rv = [NSMutableString new];
	
	double hours = floor(ti / 3600);
	double minutes = floor(fmod(ti / 60, 60));
	double seconds = fmod(ti, 60);
	double secondsRound = floor(fmod(ti, 60));
	double ms = ti - floor(ti);
	
	if(hours > 0)
	{
		[rv appendFormat:@"%@h", [_numberFormatter stringFromNumber:@(hours)]];
	}
	
	if(minutes > 0)
	{
		if(rv.length != 0)
		{
			[rv appendString:@" "];
		}
		
		[rv appendFormat:@"%@m", [_numberFormatter stringFromNumber:@(minutes)]];
	}
	
	if(rv.length == 0)
	{
		if(seconds > 0)
		{
			if(rv.length != 0)
			{
				[rv appendString:@" "];
			}
			
			[rv appendFormat:@"%@s", [_numberFormatter stringFromNumber:@(seconds)]];
		}
	}
	else
	{
		if(secondsRound > 0)
		{
			[rv appendString:@" "];
			
			[rv appendFormat:@"%@s", [_numberFormatter stringFromNumber:@(secondsRound)]];
		}
		
		if(ms > 0)
		{
			[rv appendString:@" "];
			
			[rv appendString:[self _msStringFromTimeInterval:ms round:YES]];
		}
	}
	
	return rv;
}

- (NSString*)stringFromTimeInterval:(NSTimeInterval)ti
{
	if(ti < 0.001)
	{
		return [self _usStringFromTimeInterval:ti];
	}
		
	if(ti < 1.0)
	{
		return [self _msStringFromTimeInterval:ti round:NO];
	}
	
	return [self _hmsmsStringFromTimeInterval:ti];
}

- (NSString*)stringFromDate:(NSDate *)startDate toDate:(NSDate *)endDate
{
	return [self stringFromTimeInterval:endDate.timeIntervalSinceReferenceDate - startDate.timeIntervalSinceReferenceDate];
}

- (NSString *)stringForObjectValue:(id)obj
{
	if(obj == nil)
	{
		return nil;
	}
	
	return [self stringFromTimeInterval:[obj doubleValue]];
}

@end
