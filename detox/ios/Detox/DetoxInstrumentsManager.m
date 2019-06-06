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
@import CommonCrypto;

DTX_CREATE_LOG(DetoxInstrumentsManager)

@interface NSObject ()

//DTXProfilingConfiguration
@property (class, nonatomic, strong, readonly) id defaultProfilingConfiguration;
@property (nonatomic, readwrite) NSTimeInterval samplingInterval;
@property (nonatomic, readwrite) BOOL recordEvents;
@property (nonatomic, readwrite) BOOL recordNetwork;
@property (nonatomic, readwrite) BOOL recordLocalhostNetwork;
@property (nonatomic, readwrite) BOOL profileReactNative;
@property (nonatomic, readwrite) BOOL recordInternalReactNativeEvents;
@property (nonatomic, readwrite) BOOL recordThreadInformation;
@property (nonatomic, readwrite) BOOL collectStackTraces;
@property (nonatomic, readwrite) BOOL symbolicateStackTraces;
@property (atomic, assign, readonly, getter=isRecording) BOOL recording;
@property (nonatomic, copy, null_resettable, readwrite) NSURL* recordingFileURL;

//DTXProfiler
- (void)startProfilingWithConfiguration:(id)configuration;
- (void)continueProfilingWithConfiguration:(id)configuration;
- (void)stopProfilingWithCompletionHandler:(void(^ __nullable)(NSError* __nullable error))completionHandler;
@property (atomic, copy, readonly, nullable) id profilingConfiguration;

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

//Weak link
WEAK_IMPORT_ATTRIBUTE
@interface DTXProfiler : NSObject @end

@implementation DetoxInstrumentsManager
{
	id _recorderInstance;
}

static BOOL __DTXDecryptFramework(NSURL* encryptedBinaryURL, NSURL* targetBinaryURL)
{
	@autoreleasepool {
		NSError* error;
		NSData* encryptedBinaryData = [[NSData alloc] initWithContentsOfURL:encryptedBinaryURL options:NSDataReadingMappedAlways error:&error];
		
		if(encryptedBinaryData.length == 0)
		{
			dtx_log_error(@"Unable to read data from %@; error: %@", encryptedBinaryURL.path, error);
			
			return NO;
		}
		
		NSMutableData* targetBinaryData = [NSMutableData dataWithLength:encryptedBinaryData.length];
		size_t targetBinaryLength;
		
		uint8_t key[kCCKeySizeAES256] = {0};
		uint8_t iv[kCCBlockSizeAES128] = {0};
		CCCryptorStatus status = CCCrypt(kCCDecrypt, kCCAlgorithmAES, 0, key, kCCKeySizeAES256, iv, encryptedBinaryData.bytes, encryptedBinaryData.length, targetBinaryData.mutableBytes, targetBinaryData.length, &targetBinaryLength);
		
		if(status != kCCSuccess)
		{
			dtx_log_error(@"Unable to decrypt %@", encryptedBinaryURL.path);
			
			return NO;
		}
		
		targetBinaryData.length = targetBinaryLength;
		
		if([targetBinaryData writeToURL:targetBinaryURL atomically:YES] == NO)
		{
			dtx_log_error(@"Unable to write decrypted data to %@", targetBinaryURL.path);
			
			return NO;
		}
		
		return YES;
	}
}

+ (void)load
{
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		__DTXProfiler = [DTXProfiler class];
		
		if(__DTXProfiler == NULL)
		{
			dtx_log_info(@"DTXProfiler class was not found, loading Profiler framework manually");
			
			//The user has not linked the Profiler framework. Load it manually.
			
			NSString* instrumentsPath = [NSUserDefaults.standardUserDefaults stringForKey:@"instrumentsPath"];
			if(instrumentsPath == nil)
			{
				instrumentsPath = @"/Applications/Detox Instruments.app";
			}
			
			NSURL* bundleURL = [[NSURL fileURLWithPath:instrumentsPath isDirectory:YES] URLByAppendingPathComponent:@"Contents/SharedSupport/ProfilerFramework/DTXProfiler.framework"];
			NSBundle* profilerBundle = [NSBundle bundleWithURL:bundleURL];
			
			if(profilerBundle == nil)
			{
				dtx_log_info(@"Error loading Profiler framework bundle. Bundle not found at %@", bundleURL.path);
				return;
			}
			
			NSError* error = nil;
			
			NSFileHandle* executableFileHandle = [NSFileHandle fileHandleForReadingFromURL:profilerBundle.executableURL error:&error];
			NSData* header = [executableFileHandle readDataOfLength:4];
			NSData* expectedBinaryHeader = [[NSData alloc] initWithBase64EncodedString:@"yv66vg==" options:0];
			
			if([header isEqualToData:expectedBinaryHeader] == NO)
			{
				dtx_log_info(@"Encrypted framework binary found at %@", profilerBundle.executableURL.path);
				
				NSURL* tempURL = [[NSURL fileURLWithPath:NSTemporaryDirectory() isDirectory:YES] URLByAppendingPathComponent:@"__detox_instruments_support__" isDirectory:YES];
				[NSFileManager.defaultManager removeItemAtURL:tempURL error:NULL];
				[NSFileManager.defaultManager createDirectoryAtURL:tempURL withIntermediateDirectories:YES attributes:nil error:&error];
				NSURL* targetBundleURL = [tempURL URLByAppendingPathComponent:bundleURL.lastPathComponent];
				[NSFileManager.defaultManager copyItemAtURL:bundleURL toURL:targetBundleURL error:&error];
			
				if(__DTXDecryptFramework(profilerBundle.executableURL, [targetBundleURL URLByAppendingPathComponent:profilerBundle.executableURL.lastPathComponent]) == NO)
				{
					dtx_log_error(@"Decryption failed, stopping");
					
					return;
				}
				
				profilerBundle = [NSBundle bundleWithURL:targetBundleURL];
			}
			
			[profilerBundle loadAndReturnError:&error];
			
			if(error != nil)
			{
				dtx_log_error(@"Error loading Profiler framework bundle: %@", error);
				return;
			}
		}
		else
		{
			dtx_log_info(@"DTXProfiler class was found in hosting process");
		}
		
		static void (^cleanupOnError)(void) = ^ {
			__DTXProfiler = NULL;
			__DTXMutableProfilingConfiguration = NULL;
		};
		
		__DTXProfiler = NSClassFromString(@"DTXProfiler");
		if(__DTXProfiler == NULL)
		{
			cleanupOnError();
			dtx_log_error(@"DTXProfiler class not found—this should not have happened!");
			return;
		}
		
		__DTXMutableProfilingConfiguration = NSClassFromString(@"DTXMutableProfilingConfiguration");
		if(__DTXMutableProfilingConfiguration == NULL)
		{
			cleanupOnError();
			dtx_log_error(@"DTXMutableProfilingConfiguration class not found—this should not have happened!");
			return;
		}
		
		__DTXProfilerAddTag = dlsym(RTLD_DEFAULT, "DTXProfilerAddTag");
		__DTXProfilerMarkEventIntervalBegin = dlsym(RTLD_DEFAULT, "DTXProfilerMarkEventIntervalBegin");
		__DTXProfilerMarkEventIntervalEnd = dlsym(RTLD_DEFAULT, "DTXProfilerMarkEventIntervalEnd");
		__DTXProfilerMarkEvent = dlsym(RTLD_DEFAULT, "DTXProfilerMarkEvent");
		
		if(__DTXProfilerAddTag == NULL || __DTXProfilerMarkEventIntervalBegin == NULL || __DTXProfilerMarkEventIntervalEnd == NULL || __DTXProfilerMarkEvent == NULL)
		{
			cleanupOnError();
			dtx_log_error(@"One or more DTXProfilerAPI functions are NULL—this should not have happened!");
			return;
		}
	});
}

+ (NSString *)_sanitizeFileNameString:(NSString *)fileName
{
	NSCharacterSet* illegalFileNameCharacters = [NSCharacterSet characterSetWithCharactersInString:@":/\\?%*|\"<>"];
	return [[fileName componentsSeparatedByCharactersInSet:illegalFileNameCharacters] componentsJoinedByString:@"_"];
}

+ (NSURL*)defaultURLForTestName:(NSString*)testName
{
	NSURL* documents = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
	NSURL* rv = [documents URLByAppendingPathComponent:[self _sanitizeFileNameString:testName]];
	
	dtx_log_debug(@"Returning %@ as URL", rv.path);
	
	return rv;
}

- (instancetype)init
{
	self = [super init];
	
	if(self)
	{
		_recorderInstance = [__DTXProfiler new];
		
		if(_recorderInstance == nil)
		{
			dtx_log_error(@"Profiler framework is not loaded. Did you forget to install Detox Instruments?");
		}
	}
	
	return self;
}

- (id)_configForDetoxRecordingWithURL:(NSURL*)URL
{
	id config = [__DTXMutableProfilingConfiguration defaultProfilingConfiguration];
	[config setRecordingFileURL:URL];
	
	//TODO: Finalize the actual config for Detox perf recording.
	[config setRecordEvents:YES];
	[config setProfileReactNative:YES];
	if ([config respondsToSelector:@selector(setRecordInternalReactNativeEvents:)])
	{
		[config setRecordInternalReactNativeEvents:YES];
	}

	[config setRecordNetwork:YES];
	[config setRecordLocalhostNetwork:YES];
	[config setRecordThreadInformation:YES];
	[config setCollectStackTraces:YES];
	[config setSymbolicateStackTraces:YES];
	[config setSamplingInterval:0.1];
	
	return config;
}

- (void)startRecordingAtURL:(NSURL*)URL
{
	dtx_log_info(@"Starting recording at %@", URL);
	[_recorderInstance startProfilingWithConfiguration:[self _configForDetoxRecordingWithURL:URL]];
}

- (void)continueRecordingAtURL:(NSURL*)URL
{
	dtx_log_info(@"Continuing recording at %@", URL);
	[_recorderInstance continueProfilingWithConfiguration:[self _configForDetoxRecordingWithURL:URL]];
}

- (void)stopRecordingWithCompletionHandler:(void(^)(NSError* error))completionHandler
{
	if(_recorderInstance == nil || [_recorderInstance isRecording] == NO)
	{
		dtx_log_info(@"Called stop but no recording in progress");
		
		if(completionHandler != nil)
		{
			completionHandler(nil);
		}
		
		return;
	}
	
	[_recorderInstance stopProfilingWithCompletionHandler:^(NSError * _Nullable error) {
		if(error)
		{
			dtx_log_error(@"Stopped recording with error: %@", error);
		}
		else
		{
			dtx_log_info(@"Stopped recording at %@", [[_recorderInstance profilingConfiguration] recordingFileURL]);
		}
		
		if(completionHandler != nil)
		{
			completionHandler(error);
		}
	}];
}

@end
