//
//  DetoxInstrumentsManager.m
//  Detox
//
//  Created by Leo Natan (Wix) on 2/17/19.
//  Copyright © 2019 Wix. All rights reserved.
//

#import "DetoxInstrumentsManager.h"
#import "DTXLogging.h"
#include <dlfcn.h>

DTX_CREATE_LOG(DetoxInstrumentsManager)

@interface NSObject ()

@property (class, nonatomic, strong, readonly) id defaultProfilingConfiguration;
@property (nonatomic, readwrite) BOOL recordNetwork;
@property (nonatomic, readwrite) BOOL recordThreadInformation;

- (void)startProfilingWithConfiguration:(id)configuration;
- (void)continueProfilingWithConfiguration:(id)configuration;
- (void)stopProfilingWithCompletionHandler:(void(^ __nullable)(NSError* __nullable error))completionHandler;

@end

typedef NS_ENUM(NSUInteger, __DTXEventStatus) {
	__DTXEventStatusCompleted,
	__DTXEventStatusError,
	__DTXEventStatusCancelled
};

static Class __DTXProfiler;
static Class __DTXMutableProfilingConfiguration;

static void (*__DTXProfilerAddTag)(NSString* tag);
static NSString* (*__DTXProfilerMarkEventIntervalBegin)(NSString* category, NSString* name, NSString* __nullable message);
static void (*__DTXProfilerMarkEventIntervalEnd)(NSString* identifier, __DTXEventStatus eventStatus, NSString* __nullable endMessage);
static void (*__DTXProfilerMarkEvent)(NSString* category, NSString* name, __DTXEventStatus eventStatus, NSString* __nullable startMessage);

@implementation DetoxInstrumentsManager
{
	id _recorderInstance;
}

+ (void)load
{
	__DTXProfiler = NSClassFromString(@"DTXProfiler");
	
	if(__DTXProfiler == NULL)
	{
		//The user has not linked the Profiler framework. Load it manually.
		
		//TODO: Use launch argument rather than hardcoded path.
		NSBundle* profilerBundle = [NSBundle bundleWithURL:[NSURL fileURLWithPath:@"/Applications/Detox Instruments.app/Contents/SharedSupport/ProfilerFramework/DTXProfiler.framework"]];
		NSError* error = nil;
		[profilerBundle loadAndReturnError:&error];
		
		if(error != nil)
		{
			dtx_log_error(@"Error loading Profiler framework bundle: %@", error);
		}
	}
	
	__DTXProfiler = NSClassFromString(@"DTXProfiler");
	if(__DTXProfiler == NULL)
	{
		dtx_log_error(@"DTXProfiler class not found—this should not have happened!");
		return;
	}
	
	__DTXMutableProfilingConfiguration = NSClassFromString(@"DTXMutableProfilingConfiguration");
	if(__DTXMutableProfilingConfiguration == NULL)
	{
		dtx_log_error(@"DTXMutableProfilingConfiguration class not found—this should not have happened!");
		return;
	}
	
	__DTXProfilerAddTag = dlsym(RTLD_DEFAULT, "DTXProfilerAddTag");
	__DTXProfilerMarkEventIntervalBegin = dlsym(RTLD_DEFAULT, "DTXProfilerMarkEventIntervalBegin");
	__DTXProfilerMarkEventIntervalEnd = dlsym(RTLD_DEFAULT, "DTXProfilerMarkEventIntervalEnd");
	__DTXProfilerMarkEvent = dlsym(RTLD_DEFAULT, "DTXProfilerMarkEvent");
	
	if(__DTXProfilerAddTag == NULL || __DTXProfilerMarkEventIntervalBegin == NULL || __DTXProfilerMarkEventIntervalEnd == NULL || __DTXProfilerMarkEvent == NULL)
	{
		dtx_log_error(@"One or more DTXProfilerAPI functions are NULL—this should not have happened!");
		return;
	}
}

- (instancetype)init
{
	self = [super init];
	
	if(self)
	{
		_recorderInstance = [__DTXProfiler new];
	}
	
	return self;
}

- (id)_configForDetoxRecording
{
	id config = [__DTXMutableProfilingConfiguration defaultProfilingConfiguration];
	[config setRecordNetwork:NO];
	[config setRecordThreadInformation:NO];
	
	return config;
}

- (void)startRecordingAtURL:(NSURL*)URL
{
	NSParameterAssert(_recorderInstance != nil);
	
	[_recorderInstance startProfilingWithConfiguration:self._configForDetoxRecording];
}

- (void)continueRecordingAtURL:(NSURL*)URL
{
	NSParameterAssert(_recorderInstance != nil);
	
	[_recorderInstance continueProfilingWithConfiguration:self._configForDetoxRecording];
}

- (void)stopRecordingWithCompletionHandler:(void(^)(NSError* error))completionHandler
{
	NSParameterAssert(_recorderInstance != nil);
	
	[_recorderInstance stopProfilingWithCompletionHandler:completionHandler];
}

@end
