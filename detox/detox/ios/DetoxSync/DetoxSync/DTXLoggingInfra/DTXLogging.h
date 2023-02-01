//
//  DTLogging.h
//  DTXLoggingInfra
//
//  Created by Leo Natan (Wix) on 19/07/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import <os/log.h>

#if __OBJC__
#import <Foundation/Foundation.h>

#if __has_include("DTXLoggingSubsystem.h")
#include "DTXLoggingSubsystem.h"
#endif
#ifdef DTX_LOG_SUBSYSTEM
#define DTX_CREATE_LOG(name) DTX_CREATE_LOG_PREFIX(name, @"");

#define DTX_CREATE_LOG_PREFIX(name, prefix) static NSString* __current_log_prefix = prefix;\
static os_log_t __current_file_log;\
__attribute__((__not_tail_called__)) \
__attribute__((__nothrow__)) \
__unused static os_log_t __prepare_and_return_file_log(void) { \
	static dispatch_once_t __current_file_log_once_token; \
	dispatch_once(&__current_file_log_once_token, ^{ \
		__current_file_log = os_log_create(DTX_LOG_SUBSYSTEM, #name); \
	}); \
	return __current_file_log; \
}
#else
#define __prepare_and_return_file_log() OS_LOG_DEFAULT
#endif

#define dtx_log_debug(format, ...) __dtx_log(__prepare_and_return_file_log(), OS_LOG_TYPE_DEBUG, __current_log_prefix, format, ##__VA_ARGS__)
#define dtx_log_info(format, ...) __dtx_log(__prepare_and_return_file_log(), OS_LOG_TYPE_INFO, __current_log_prefix, format, ##__VA_ARGS__)
#define dtx_log_error(format, ...) __dtx_log(__prepare_and_return_file_log(), OS_LOG_TYPE_ERROR, __current_log_prefix, format, ##__VA_ARGS__)
#define dtx_log_fault(format, ...) __dtx_log(__prepare_and_return_file_log(), OS_LOG_TYPE_FAULT, __current_log_prefix, format, ##__VA_ARGS__)

__attribute__((__nothrow__))
NSString* __dtx_log_get_subsystem(void);

__attribute__((__nothrow__))
void __dtx_log(os_log_t log, os_log_type_t logType, NSString* prefix, NSString* format, ...) NS_FORMAT_FUNCTION(4,5);

__attribute__((__nothrow__))
void __dtx_logv(os_log_t log, os_log_type_t logType, NSString* prefix, NSString* format, va_list args);
#endif
