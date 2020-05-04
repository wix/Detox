//
//  DTXAssertionHandler.m
//  Detox
//
//  Created by Leo Natan (Wix) on 4/28/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "DTXAssertionHandler.h"
#import "DTXAppleInternals.h"

@implementation DTXTestAssertionException

+ (NSException *)exceptionWithName:(NSExceptionName)name reason:(nullable NSString *)reason userInfo:(nullable NSDictionary *)userInfo view:(nullable UIView*)view
{
	DTXTestAssertionException* rv = (id)[super exceptionWithName:name reason:reason userInfo:userInfo];
	rv.view = view;
	return rv;
}

@end

BOOL dtx_try(void (^block)(void), NSError * __nullable * __null_unspecified error)
{
	return [DTXAssertionHandler try:^ {
		block();
	} error:error];
}

@implementation DTXAssertionHandler

+ (BOOL)try:(void(NS_NOESCAPE ^)(void))block error:(NSError * __nullable * __null_unspecified)error
{
	@try
	{
		block();
		return YES;
	}
	@catch(DTXTestAssertionException *exception)
	{
		if(error)
		{
			NSMutableDictionary* userInfo = @{NSLocalizedDescriptionKey: exception.reason, @"fullUserInfo": exception.userInfo}.mutableCopy;
			
			if(exception.view != nil)
			{
				userInfo[@"viewHierarchy"] = exception.view.window.recursiveDescription;
			}
			
			*error = [NSError errorWithDomain:@"Detox" code:0 userInfo:userInfo];
		}
		
		return nil;
	}
	//Only catch DTXTestAssertionException here. Others will be reported by Detox crash reporter.
	@catch(NSException* exception)
	{
		[exception raise];
	}
	
	return NO;
}

+ (void)handleFailureInFunction:(NSString *)functionName file:(NSString *)fileName lineNumber:(NSInteger)line view:(UIView*)view description:(NSString *)format, ...
{
	va_list argumentList;
	va_start(argumentList, format);
	[self handleFailureInFunction:functionName file:fileName lineNumber:line view:view description:format arguments:argumentList];
	va_end(argumentList);
	
}

+ (void)handleFailureInMethod:(SEL)selector object:(id)object file:(NSString *)fileName lineNumber:(NSInteger)line view:(UIView*)view description:(NSString *)format, ...
{
	va_list argumentList;
	va_start(argumentList, format);
	[self handleFailureInMethod:selector object:object file:fileName lineNumber:line view:view description:format arguments:argumentList];
	va_end(argumentList);
}

+ (void)handleFailureInFunction:(NSString *)functionName file:(NSString *)fileName lineNumber:(NSInteger)line view:(UIView*)view description:(NSString *)format arguments:(va_list)arguments
{
	[[DTXTestAssertionException exceptionWithName:@"DetoxException" reason:[[NSString alloc] initWithFormat:format arguments:arguments] userInfo:@{
		@"functionName": functionName,
		@"file": fileName,
		@"lineNumber": @(line)
	} view:view] raise];
}

+ (void)handleFailureInMethod:(SEL)selector object:(id)object file:(NSString *)fileName lineNumber:(NSInteger)line view:(UIView*)view description:(NSString *)format arguments:(va_list)arguments
{
	[[DTXTestAssertionException exceptionWithName:@"DetoxException" reason:[[NSString alloc] initWithFormat:format arguments:arguments] userInfo:@{
		@"selector": NSStringFromSelector(selector),
		@"object": [object debugDescription],
		@"file": fileName,
		@"lineNumber": @(line)
	} view:view] raise];
}

@end
