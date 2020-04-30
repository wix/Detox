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
	@catch(DTXTestAssertionException *exception)
	{
		if(*error)
		{
			*error = [NSError errorWithDomain:@"Detox" code:0 userInfo:@{NSLocalizedDescriptionKey: exception.reason, @"fullUserInfo": exception.userInfo}];
		}
		
		return nil;
	}
	//Only catch DTXTestAssertionException here. Others will be reported by Detox crash reporter.
	@catch(NSException* exception)
	{
		[exception raise];
	}
	
	return rv;
}

+ (void)handleFailureInFunction:(NSString *)functionName file:(NSString *)fileName lineNumber:(NSInteger)line description:(NSString *)format, ...
{
	va_list argumentList;
	va_start(argumentList, format);
	[self handleFailureInFunction:functionName file:fileName lineNumber:line description:format arguments:argumentList];
	va_end(argumentList);
	
}

+ (void)handleFailureInMethod:(SEL)selector object:(id)object file:(NSString *)fileName lineNumber:(NSInteger)line description:(NSString *)format, ...
{
	va_list argumentList;
	va_start(argumentList, format);
	[self handleFailureInMethod:selector object:object file:fileName lineNumber:line description:format arguments:argumentList];
	va_end(argumentList);
}

+ (void)handleFailureInFunction:(NSString *)functionName file:(NSString *)fileName lineNumber:(NSInteger)line description:(NSString *)format arguments:(va_list)arguments
{
	[[DTXTestAssertionException exceptionWithName:@"DetoxException" reason:[[NSString alloc] initWithFormat:format arguments:arguments] userInfo:@{
		@"functionName": functionName,
		@"file": fileName,
		@"lineNumber": @(line)
	}] raise];
}

+ (void)handleFailureInMethod:(SEL)selector object:(id)object file:(NSString *)fileName lineNumber:(NSInteger)line description:(NSString *)format arguments:(va_list)arguments
{
	[[DTXTestAssertionException exceptionWithName:@"DetoxException" reason:[[NSString alloc] initWithFormat:format arguments:arguments] userInfo:@{
		@"selector": NSStringFromSelector(selector),
		@"object": [object debugDescription],
		@"file": fileName,
		@"lineNumber": @(line)
	}] raise];
}

@end
