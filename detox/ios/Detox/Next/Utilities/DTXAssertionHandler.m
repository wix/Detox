//
//  DTXAssertionHandler.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/28/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "DTXAssertionHandler.h"

@implementation DTXTestAssertionException @end

@implementation DTXAssertionHandler

+ (__nullable id)try:(id(NS_NOESCAPE ^)(void))block error:(NSError**)error
{
	id rv = nil;
	@try
	{
		rv = block();
	}
	@catch (DTXTestAssertionException *exception)
	{
		return nil;
	}
	
	return rv;
}

+ (void)handleFailureInFunction:(NSString *)functionName file:(NSString *)fileName lineNumber:(NSInteger)line description:(NSString *)format, ...
{
	
}

+ (void)handleFailureInMethod:(SEL)selector object:(id)object file:(NSString *)fileName lineNumber:(NSInteger)line description:(NSString *)format, ...
{
	
}

@end
