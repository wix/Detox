//
//  NSThread+DetoxUtils.m
//  Detox
//
//  Created by Leo Natan (Wix) on 7/16/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "NSThread+DetoxUtils.h"
#import "DTXAddressInfo.h"

@implementation NSThread (DetoxUtils)

+ (NSString*)dtx_demangledCallStackSymbols
{
	return [self dtx_demangledCallStackSymbolsForReturnAddresses:self.callStackReturnAddresses startIndex:1];
}

+ (NSString*)dtx_demangledCallStackSymbolsForReturnAddresses:(NSArray<NSNumber*>*)returnAddresses startIndex:(NSInteger)startIndex
{
	NSArray* symbols = [returnAddresses dtx_mapObjectsUsingBlock:^id _Nonnull(NSNumber * _Nonnull obj, NSUInteger idx) {
		return [[[DTXAddressInfo alloc] initWithAddress:obj.unsignedIntegerValue] formattedDescriptionForIndex:idx];
	}];
	return [NSString stringWithFormat:@"(\n\t%@\n)", [symbols componentsJoinedByString:@"\n\t"]];
}

@end
