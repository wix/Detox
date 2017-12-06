//
//  DetoxCrashHandler.m
//  Detox
//
//  Created by Leo Natan (Wix) on 12/5/17.
//  Copyright © 2017 Wix. All rights reserved.
//

#include <fishhook.h>
@import Darwin;
@import Foundation;
#import "DetoxManager.h"
#import <Detox/Detox-Swift.h>

static void __DTXHandleCrash(NSException* exception, NSNumber* signal)
{
	NSNumber* threadNumber = [[NSThread currentThread] valueForKeyPath:@"private.seqNum"];
	NSString* queueName = @"";
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
	dispatch_queue_t currentQueue = dispatch_get_current_queue();
#pragma clang diagnostic pop
	if(currentQueue)
	{
		queueName = [NSString stringWithUTF8String:dispatch_queue_get_label(currentQueue)];
	}
	
	NSMutableDictionary* report = [@{@"threadNumber": threadNumber, @"queueName": queueName} mutableCopy];
	if(exception)
	{
		report[@"exceptionDetails"] = exception.debugDescription;
	}
	
	if(signal)
	{
		report[@"exceptionDetails"] = [NSString stringWithFormat:@"Signal %@ was raised\n%@", signal, [NSThread callStackSymbols]];
	}
	
	[DetoxManager.sharedManager notifyOnCrashWithDetails:report];
	
	[NSThread sleepForTimeInterval:5];
}

static void (*__orig_NSSetUncaughtExceptionHandler)(NSUncaughtExceptionHandler * _Nullable);
static void __dtx_NSSetUncaughtExceptionHandler(NSUncaughtExceptionHandler * _Nullable handler)
{}

static void __DTXUncaughtExceptionHandler(NSException* exception)
{
	__DTXHandleCrash(exception, nil);
}

static NSSet<NSNumber*>* __supportedSignals;

static int (*__orig_sigaction)(int, const struct sigaction * __restrict, struct sigaction * __restrict);
static int __dtx_sigaction(int signal, const struct sigaction * __restrict newaction, struct sigaction * __restrict oldaction)
{
	if([__supportedSignals containsObject:@(signal)] == NO)
	{
		return __orig_sigaction(signal, newaction, oldaction);
	}
	
	return 0;
}

static void __DTXHandleSignal(int signal)
{
	__DTXHandleCrash(nil, @(signal));
	
	exit(1);
}

__attribute__((constructor))
static void __DTXInstallCrashHandlers()
{
	__orig_NSSetUncaughtExceptionHandler = dlsym(RTLD_DEFAULT, "NSSetUncaughtExceptionHandler");
	
	{
		struct rebinding rebindings[] = {
			{"NSSetUncaughtExceptionHandler", __dtx_NSSetUncaughtExceptionHandler, NULL}
		};
		
		rebind_symbols(rebindings, 1);
	}
	
	__orig_NSSetUncaughtExceptionHandler(__DTXUncaughtExceptionHandler);
	
	__supportedSignals = [NSSet setWithArray:@[@(SIGQUIT), @(SIGILL), @(SIGTRAP), @(SIGABRT), @(SIGFPE), @(SIGBUS), @(SIGSEGV), @(SIGSYS)]];
	
	__orig_sigaction = dlsym(RTLD_DEFAULT, "sigaction");
	
	{
		struct rebinding rebindings[] = {
			{"sigaction", __dtx_sigaction, NULL}
		};
		
		rebind_symbols(rebindings, 1);
	}
	
	struct sigaction signalAction;
	memset(&signalAction, 0, sizeof(signalAction));
	sigemptyset(&signalAction.sa_mask);
	signalAction.sa_handler = &__DTXHandleSignal;
	
	[__supportedSignals enumerateObjectsUsingBlock:^(NSNumber * _Nonnull obj, BOOL * _Nonnull stop) {
		int signum = obj.intValue;
		
		__orig_sigaction(signum, &signalAction, NULL);
	}];
}
