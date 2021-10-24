//
//  DetoxCrashHandler.mm
//  Detox
//
//  Created by Leo Natan (Wix) on 12/5/17.
//  Copyright © 2017 Wix. All rights reserved.
//

#import <Detox/Detox-Swift.h>
#import "DTXAssertionHandler.h"
#import "fishhook.h"

#import <dlfcn.h>
#import <Foundation/Foundation.h>
#include <cstdlib>
#include <exception>
#include <typeinfo>
#include <cxxabi.h>
#import <asl.h>

__attribute__ ((visibility ("hidden")))
OBJC_EXTERN void __DTXHandleCrash(NSException* exception, NSNumber* signal, NSString* other)
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
		NSString* prefix = @"Exception was thrown: ";
		if([exception isKindOfClass:DTXTestAssertionException.class])
		{
			prefix = @"THIS SHOULD NOT HAVE HAPPENED AND IS A BUG IN DETOX LOGIC. PLEASE OPEN AN ISSUE IN https://github.com/wix/Detox/issues/new/choose AND POST THIS CRASH\n";
		}
		
		report[@"errorDetails"] = [NSString stringWithFormat:@"%@\n%@\n%@\n%@", prefix, exception.name, exception.reason, exception.dtx_demangledCallStackSymbols];
		report[@"exceptionName"] = exception.name ?: @"<Unknown>";
		report[@"exceptionReason"] = exception.reason ?: @"<Unknown>";
	}
	else if(signal)
	{
		report[@"errorDetails"] = [NSString stringWithFormat:@"Signal %@ was raised\n%@", signal, [NSThread dtx_demangledCallStackSymbols]];
	}
	else if(other)
	{
		report[@"errorDetails"] = [NSString stringWithFormat:@"%@\n%@", other, [NSThread dtx_demangledCallStackSymbols]];;
	}
	
	[DTXDetoxManager.sharedManager notifyOnCrashWithDetails:report];
	
	[NSThread sleepForTimeInterval:5];
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

__attribute__ ((visibility ("hidden")))
OBJC_EXTERN int __dtx_asl_log(asl_object_t client, asl_object_t msg, int level, const char *format, ...)
{
	va_list args;
	va_start(args, format);

	if(level == ASL_LEVEL_ERR)
	{
		//No other way to catch Swift fatal errors. We swizzle asl_log, which is called by the Swift runtime
		// in https://github.com/apple/swift/blob/889e84a2029a28f25dd62c3bfc1a9a0241b0413f/stdlib/public/runtime/Errors.cpp#L310
		//We then check for a known Swift function in the first few frames of the call stack.
		NSArray<NSString*>* callStackSymbols = NSThread.callStackSymbols;
		for (NSUInteger idx = 1; idx < MIN(callStackSymbols.count, 4); idx++) {
			if([callStackSymbols[idx] containsString:@"swift_reportError"])
			{
				NSString* message = [[NSString alloc] initWithFormat:[NSString stringWithUTF8String:format] arguments:args];
				va_end(args);
				__DTXHandleCrash(nil, nil, [message stringByTrimmingCharactersInSet:NSCharacterSet.newlineCharacterSet]);
				
				va_start(args, format);
				
				break;
			}
		}
	}
	
	int rv = asl_vlog(client, msg, level, format, args);
	va_end(args);

	return rv;
}

__attribute__ ((visibility ("hidden")))
OBJC_EXTERN void __DTXHandleSignal(int signal)
{
	__DTXHandleCrash(nil, @(signal), nil);
	
	exit(1);
}

OBJC_EXTERN std::type_info *__cxa_current_exception_type(void);
OBJC_EXTERN void __cxa_rethrow(void);

thread_local BOOL __alreadyTerminating = NO;

static void (*__old_terminate)(void) = nullptr;
__attribute__ ((visibility ("hidden")))
static void __dtx_terminate(void)
{
	if(__alreadyTerminating)
	{
		(*__old_terminate)();
		return;
	}
	
	__alreadyTerminating = YES;
	
	std::type_info* exceptionType = __cxa_current_exception_type();
	if (exceptionType == nullptr)
	{
		// No current exception.
		__DTXHandleCrash(nil, nil, @"Exception of unknown type was thrown");
		(*__old_terminate)();
	}
	else
	{
		// There is a current exception. Check if it's an objc exception.
		@try
		{
			__cxa_rethrow();
		}
		@catch (NSException* e)
		{
			__DTXHandleCrash(e, nil, nil);
			(*__old_terminate)();
		}
		@catch (id obj)
		{
			__DTXHandleCrash(nil, nil, [NSString stringWithFormat:@"ObjC exception of type “%@” was thrown", [obj class]]);
			(*__old_terminate)();
		}
		@catch (...)
		{
			const char* exceptionTypeMangledName = exceptionType->name();
			
			int status = -1;
			const char* demangled = abi::__cxa_demangle(exceptionTypeMangledName, NULL, NULL, &status);
			NSString* exceptionTypeName = nil;
			if(demangled)
			{
				exceptionTypeName = [NSString stringWithUTF8String:demangled];
				free((void*)demangled);
			}
			else
			{
				exceptionTypeName = [NSString stringWithUTF8String:exceptionTypeMangledName];
			}
			
			__DTXHandleCrash(nil, nil, [NSString stringWithFormat:@"C++ exception of type “%@” was thrown", exceptionTypeName]);
			(*__old_terminate)();
		}
	}
}

static std::terminate_handler (*__old_std_set_terminate)(std::terminate_handler) = nil;
static std::terminate_handler __dtx_std_set_terminate(std::terminate_handler new_handler)
{
	std::terminate_handler rv = __old_terminate;
	__old_terminate = new_handler;
	return rv;
}

__attribute__((constructor))
OBJC_EXTERN void __DTXInstallCrashHandlersIfNeeded(void)
{
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		__old_std_set_terminate = (std::terminate_handler (*)(std::terminate_handler))dlsym(RTLD_DEFAULT, "_ZSt13set_terminatePFvvE");
		{
			//Mnagled name of "std::set_terminate()"
			struct rebinding rebindings[] = {
				{"_ZSt13set_terminatePFvvE", (void*)__dtx_std_set_terminate, nullptr }
			};
			rebind_symbols(rebindings, 1);
		}
		
		__old_terminate = __old_std_set_terminate(__dtx_terminate);
		__supportedSignals = [NSSet setWithArray:@[@(SIGQUIT), @(SIGILL), @(SIGTRAP), @(SIGABRT), @(SIGFPE), @(SIGBUS), @(SIGSEGV), @(SIGSYS)]];
		__orig_sigaction = (int (*)(int, const struct sigaction * __restrict, struct sigaction * __restrict))dlsym(RTLD_DEFAULT, "sigaction");
		
		{
			struct rebinding rebindings[] = {
				{"sigaction", (void*)__dtx_sigaction, nullptr},
				{"asl_log", (void*)__dtx_asl_log, nullptr},
			};
			
			rebind_symbols(rebindings, sizeof(rebindings) / sizeof(rebindings[0]));
		}
		
		struct sigaction signalAction;
		memset(&signalAction, 0, sizeof(signalAction));
		sigemptyset(&signalAction.sa_mask);
		signalAction.sa_handler = &__DTXHandleSignal;
		
		[__supportedSignals enumerateObjectsUsingBlock:^(NSNumber * _Nonnull obj, BOOL * _Nonnull stop) {
			int signum = obj.intValue;
			
			__orig_sigaction(signum, &signalAction, nullptr);
		}];
	});
}
