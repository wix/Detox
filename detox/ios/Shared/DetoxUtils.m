//
//  DetoxUtils.m
//  DetoxHelper
//
//  Created by Leo Natan (Wix) on 11/3/19.
//

#import "DetoxUtils.h"
#include <sys/sysctl.h>

#pragma mark Debugger

BOOL DTXIsDebuggerAttached(void)
{
	static BOOL debuggerIsAttached = NO;
	
	static dispatch_once_t debuggerPredicate;
	dispatch_once(&debuggerPredicate, ^{
		struct kinfo_proc info;
		size_t info_size = sizeof(info);
		int name[4];
		
		name[0] = CTL_KERN;
		name[1] = KERN_PROC;
		name[2] = KERN_PROC_PID;
		name[3] = getpid();
		
		if(sysctl(name, 4, &info, &info_size, NULL, 0) == -1)
		{
			debuggerIsAttached = NO;
		}
		
		if(debuggerIsAttached == NO && (info.kp_proc.p_flag & P_TRACED) != 0)
		{
			debuggerIsAttached = YES;
		}
	});
	
	return debuggerIsAttached;
}

void DTXEnsureMainThread(dispatch_block_t block)
{
	if(NSThread.isMainThread)
	{
		block();
	}
	else
	{
		dispatch_async(dispatch_get_main_queue(), block);
	}
}
