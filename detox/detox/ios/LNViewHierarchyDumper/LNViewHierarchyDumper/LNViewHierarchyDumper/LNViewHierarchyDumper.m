//
//  LNViewHierarchyDumper.m
//  LNViewHierarchyDumper
//
//  Created by Leo Natan (Wix) on 7/3/20.
//

#import "LNViewHierarchyDumper.h"
#include <mach-o/dyld.h>
@import Darwin;

#if TARGET_OS_MACCATALYST || TARGET_OS_OSX
@import AppKit;
#endif

#if DEBUG
@import ObjectiveC;
#endif


#if TARGET_OS_MACCATALYST

@interface NSTask : NSObject @end

@interface NSTask ()

@property (nullable, copy) NSURL* executableURL;
@property (nullable, copy) NSArray<NSString*>* arguments;
@property (nullable, copy) NSDictionary<NSString*, NSString*>* environment;
@property (nullable, retain) id standardOutput;
@property (nullable, retain) id standardError;

@property(readonly) int terminationStatus;

@property(copy, nonnull) void (^terminationHandler)(NSTask* _Nonnull task);

- (BOOL)launch;

@end

#endif

@interface NSObject ()

//DBGTargetHub
+ (id) sharedHub;
- (NSData*)performRequestWithRequestInBase64:(NSString*)arg1;

//DebugHierarchyTargetHub
- (id) performRequest:(id /*DBGTargetHub*/)arg1 error:(NSError**)error;

//DebugHierarchyRequest
+ (id) requestWithBase64Data:(NSString*)arg1 error:(NSError**)arg2;

@end

#if defined(__IPHONE_14_0) || defined(__MAC_10_16) || defined(__MAC_11_0) || defined(__TVOS_14_0) || defined(__WATCHOS_7_0)
__attribute__((objc_direct_members))
#endif
@implementation LNViewHierarchyDumper
{
	BOOL _isFrameworkLoaded;
	NSError* _loadError;
}

+ (LNViewHierarchyDumper *)sharedDumper
{
	static LNViewHierarchyDumper* rv = nil;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		rv = [[LNViewHierarchyDumper alloc] _init];
	});
	return rv;
}

- (instancetype)init
{
	[self doesNotRecognizeSelector:_cmd];
	return nil;
}

- (instancetype)_init
{
	self = [super init];
	
	if(self)
	{
		[self _loadDebugHierarchyFoundationFramework];
	}
	
	return self;
}

#if DEBUG
//static void func(const struct mach_header* mh, intptr_t vmaddr_slide)
//{
//	Dl_info  DlInfo;
//	dladdr(mh, &DlInfo);
//	const char* image_name = DlInfo.dli_fname;
//
//	NSLog(@"%s", image_name);
//}
#endif

- (void)_loadDebugHierarchyFoundationFramework
{
#if DEBUG
//	_dyld_register_func_for_add_image(func);
#endif
	
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		//macOS: <XCODE>/Contents/SharedFrameworks/DebugHierarchyFoundation.framework

#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST || TARGET_OS_OSX
#if TARGET_OS_SIMULATOR
		NSBundle* someSimulatorBundle = [NSBundle bundleForClass:NSObject.class];
		NSURL* simURL = [[someSimulatorBundle.bundleURL URLByAppendingPathComponent:@"../.."] URLByStandardizingPath];
		NSURL* bundleURL = [simURL URLByAppendingPathComponent:@"Developer/Library/PrivateFrameworks/DebugHierarchyFoundation.framework"];
		NSURL* libViewDebuggerSupportURL = [simURL URLByAppendingPathComponent:@"Developer/Library/PrivateFrameworks/DTDDISupport.framework/libViewDebuggerSupport.dylib"];
#else
		NSTask* whichXcodeTask = [NSTask new];
		whichXcodeTask.executableURL = [NSURL fileURLWithPath:@"/usr/bin/xcode-select"];
		whichXcodeTask.arguments = @[@"-p"];
		whichXcodeTask.environment = @{};
		
		NSPipe* outPipe = [NSPipe pipe];
		NSMutableData* outData = [NSMutableData new];
		whichXcodeTask.standardOutput = outPipe;
		outPipe.fileHandleForReading.readabilityHandler = ^(NSFileHandle * _Nonnull fileHandle) {
			[outData appendData:fileHandle.availableData];
		};
		
		NSPipe* errPipe = [NSPipe pipe];
		NSMutableData* errData = [NSMutableData new];
		whichXcodeTask.standardError = errPipe;
		errPipe.fileHandleForReading.readabilityHandler = ^(NSFileHandle * _Nonnull fileHandle) {
			[errData appendData:fileHandle.availableData];
		};
		
		dispatch_semaphore_t waitForTermination = dispatch_semaphore_create(0);
		
		whichXcodeTask.terminationHandler = ^(NSTask* _Nonnull task) {
			outPipe.fileHandleForReading.readabilityHandler = nil;
			errPipe.fileHandleForReading.readabilityHandler = nil;
			
			dispatch_semaphore_signal(waitForTermination);
		};
		
		[whichXcodeTask launch];
		
		dispatch_semaphore_wait(waitForTermination, DISPATCH_TIME_FOREVER);
		
		if(whichXcodeTask.terminationStatus != 0)
		{
			NSString* errString = [[NSString alloc] initWithData:errData encoding:NSUTF8StringEncoding];
			_loadError = [NSError errorWithDomain:@"LNViewHierarchyDumperDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: errString}];
			return;
		}
		
		NSString* xcodePath = [[[NSString alloc] initWithData:outData encoding:NSUTF8StringEncoding] stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet];
		
		if(xcodePath.length == 0)
		{
			_loadError = [NSError errorWithDomain:@"LNViewHierarchyDumperDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: @"Unable to find the current active developer directory"}];
			
			return;
		}
		
		NSURL* bundleURL = [[[NSURL fileURLWithPath:xcodePath] URLByAppendingPathComponent:@"../SharedFrameworks/DebugHierarchyFoundation.framework"] URLByStandardizingPath];
		NSURL* libViewDebuggerSupportURL = [[NSURL fileURLWithPath:xcodePath] URLByAppendingPathComponent:@"Platforms/MacOSX.platform/Developer/Library/Debugger/"
#if TARGET_OS_MACCATALYST
											"libViewDebuggerSupport_macCatalyst.dylib"
#else
											"libViewDebuggerSupport.dylib"
#endif
											];
#endif
		NSBundle* bundleToLoad = [NSBundle bundleWithURL:bundleURL];
		NSError* error;
		_isFrameworkLoaded = [bundleToLoad loadAndReturnError:&error];
		_loadError = error;
		
		if(NULL == dlopen(libViewDebuggerSupportURL.path.UTF8String, RTLD_NOW))
		{
			_isFrameworkLoaded = NO;
			_loadError = [NSError errorWithDomain:@"LNViewHierarchyDumperDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Unable to load %@: %s", libViewDebuggerSupportURL.lastPathComponent, dlerror()]}];
		}
		
#if DEBUG
//		static int cnt = 0;
//		if(_isFrameworkLoaded == YES)
//		{
//			Method m1 = class_getInstanceMethod(NSClassFromString(@"DebugHierarchyTargetHub"), NSSelectorFromString(@"performRequest:error:"));
//			NSData* (*orig)(id, SEL, id, NSError**) = (void*)method_getImplementation(m1);
//			method_setImplementation(m1, imp_implementationWithBlock(^(id _self, id arg, NSError** error) {
//				//				NSLog(@"🤦‍♂️ %@", NSThread.callStackSymbols);
//				NSLog(@"🤦‍♂️ %@ %@", object_getClass(arg), arg);
//				
//				NSData* rv = orig(_self, NSSelectorFromString(@"performRequestWithRequestInBase64:"), arg, error);
//				if(error && *error)
//				{
//					NSLog(@"🤡 %@", *error);
//				}
//				
//				NSLog(@"🤦‍♂️ %@ %@", object_getClass(rv), rv);
//				
//				cnt++;
//				
//				return rv;
//			}));
//		}
#endif
#else
		_isFrameworkLoaded = NO;
		_loadError = [NSError errorWithDomain:@"LNViewHierarchyDumperDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: @"LNViewHierarchyDumper is only supported on simulators, Catalyst and macOS (with Xcode installed)"}];
#endif
	});
}

#define GENERIC_ERROR_IF_NEEDED() if(error && !*error) { *error = [NSError errorWithDomain:@"LNViewHierarchyDumperDomain" code:0 userInfo:@{NSLocalizedDescriptionKey: @"Unknown error encountered; try restarting your simulator (this framework is as buggy or bug-free as Xcode's visual inspector 🤷‍♂️)"}]; }
#define RETURN_IF_FALSE(cmd) if(NO == cmd) { GENERIC_ERROR_IF_NEEDED(); return NO; }
#define RETURN_IF_NIL(arg) if(arg == nil) { GENERIC_ERROR_IF_NEEDED(); return NO; }

#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST || TARGET_OS_OSX
static NSArray<NSString*>* LNExtractPhase1ResponseObjects(NSDictionary* phase1Response)
{
	NSArray<NSDictionary*>* topLevelGroupsCALayers	= phase1Response[@"topLevelGroups"][@"com.apple.QuartzCore.CALayer"][@"debugHierarchyObjects"];
	
	return [topLevelGroupsCALayers valueForKey:@"objectID"];
}
#endif

- (BOOL)dumpViewHierarchyToURL:(NSURL*)URL error:(NSError**)error
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST || TARGET_OS_OSX
	if(_isFrameworkLoaded == NO)
	{
#endif
		if(error) { *error = _loadError; }

		return NO;
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST || TARGET_OS_OSX
	}
	
	if([URL.lastPathComponent hasSuffix:@".viewhierarchy"] == NO)
	{
		URL = [URL URLByAppendingPathComponent:[NSString stringWithFormat:@"%@[%@].viewhierarchy", NSProcessInfo.processInfo.processName, @(NSProcessInfo.processInfo.processIdentifier)]];
	}
	
	if([NSFileManager.defaultManager fileExistsAtPath:URL.path])
	{
		RETURN_IF_FALSE([NSFileManager.defaultManager removeItemAtURL:URL error:error]);
	}
	
	RETURN_IF_FALSE([NSFileManager.defaultManager createDirectoryAtURL:URL withIntermediateDirectories:YES attributes:nil error:error]);
	
	NSURL* requestResponses = [URL URLByAppendingPathComponent:@"RequestResponses"];
	RETURN_IF_FALSE([NSFileManager.defaultManager createDirectoryAtURL:requestResponses withIntermediateDirectories:YES attributes:nil error:error]);
	
	NSDictionary* phase1Dictionary = @{
		@"DBGHierarchyRequestName": @"Initial request",
		@"DBGHierarchyRequestInitiatorVersionKey": @3,
		@"DBGHierarchyRequestPriority": @0,
		@"DBGHierarchyObjectDiscovery": @1,
		@"DBGHierarchyRequestActions": @[
				@{
					@"actionClass": @"DebugHierarchyResetAction"
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"dbgFormattedDisplayName"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": NSNull.null,
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"anchorPoint",
							@"anchorPointZ",
							@"bounds",
							@"contentsScale",
							@"doubleSided",
							@"frame",
							@"geometryFlipped",
							@"masksToBounds",
							@"name",
							@"opacity",
							@"opaque",
							@"position",
							@"sublayerTransform",
							@"transform",
							@"zPosition",
							@"dbg_ListID",
							@"optimizationOpportunities"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"CALayer"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"constant",
							@"firstAttribute",
							@"firstItem",
							@"identifier",
							@"multiplier",
							@"priority",
							@"relation",
							@"secondAttribute",
							@"secondItem"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"NSLayoutConstraint"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"anchorPoint",
							@"frame",
							@"hidden",
							@"position",
							@"untransformedSize",
							@"visualRepresentationOffset",
							@"xScale",
							@"yScale",
							@"zPosition",
							@"zRotation"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"SKNode"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"scaleMode",
							@"size"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"SKScene"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @1,
					@"propertyNames": NSNull.null,
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @3,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"SKView"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyActionLegacyV1",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @1,
					@"propertyNames": NSNull.null,
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @3,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"SKScene"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyActionLegacyV1",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @1,
					@"propertyNames": NSNull.null,
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @3,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"SKNode"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyActionLegacyV1",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"displayCornerRadius",
							@"nativeBounds",
							@"nativeDisplayBounds",
							@"nativeScale",
							@"scale",
							@"dbgScreenShape",
							@"dbgScreenShapeIsRectangular"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"UIScreen"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"keyWindow",
							@"statusBarOrientation"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"UIApplication"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"title",
							@"activationState"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"UIScene"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"title",
							@"internal",
							@"visible"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"UIWindow"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"title"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"UIViewController"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"alpha",
							@"ambiguityStatusMask",
							@"bounds",
							@"dbgViewForFirstBaselineLayout",
							@"dbgViewForLastBaselineLayout",
							@"firstBaselineOffsetFromTop",
							@"frame",
							@"hasAmbiguousLayout",
							@"hidden",
							@"horizontalAffectingConstraints",
							@"lastBaselineOffsetFromBottom",
							@"layoutMargins",
							@"verticalAffectingConstraints",
							@"dbgSubviewHierarchy"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"UIView"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"layoutFrame",
							@"identifier"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"UILayoutGuide"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"dbg_holdsSymbolImage"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"UIImageView"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"axis"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": @[
							@"UIStackView"
					],
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				}
		],
		@"DBGHierarchyRequestIdentifier": NSUUID.UUID.UUIDString,
//		@"DBGHierarchyRequestTransportCompression": @YES
	};
	NSData* phase1JsonData = [NSJSONSerialization dataWithJSONObject:phase1Dictionary options:0 error:error];
	RETURN_IF_NIL(phase1JsonData);
	
	id sharedHub = [NSClassFromString(@"DebugHierarchyTargetHub") sharedHub];
	id phase1Request = [NSClassFromString(@"DebugHierarchyRequest") requestWithBase64Data:[phase1JsonData base64EncodedStringWithOptions:0] error:error];
	RETURN_IF_NIL(phase1Request);
	NSData* phase1ResponseData = [sharedHub performRequest:phase1Request error:error];
	RETURN_IF_NIL(phase1ResponseData);
	RETURN_IF_FALSE([phase1ResponseData writeToURL:[requestResponses URLByAppendingPathComponent:@"Response_0"] options:NSDataWritingAtomic error:error]);
	
	NSDictionary* phase1Response = [NSJSONSerialization JSONObjectWithData:phase1ResponseData options:0 error:error];
	RETURN_IF_NIL(phase1Response);
	
	NSArray* objects = LNExtractPhase1ResponseObjects(phase1Response);
	RETURN_IF_NIL(objects);
	
	NSDictionary* phase2Dictionary = @{
		@"DBGHierarchyRequestName": @"Fetch encoded layers",
		@"DBGHierarchyRequestInitiatorVersionKey": @3,
		@"DBGHierarchyRequestPriority": @0,
		@"DBGHierarchyObjectDiscovery": @2,
		@"DBGHierarchyRequestActions": @[
				@{
					@"objectIdentifiers": objects,
					@"options": @0,
					@"propertyNames": @[
							@"encodedPresentationLayer"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": NSNull.null,
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @0
				}
		],
		@"DBGHierarchyRequestIdentifier": NSUUID.UUID.UUIDString,
		@"DBGHierarchyRequestTransportCompression": @YES
	};

	NSData* phase2JsonData = [NSJSONSerialization dataWithJSONObject:phase2Dictionary options:0 error:error];
	RETURN_IF_NIL(phase2JsonData);
	
	id phase2Request = [NSClassFromString(@"DebugHierarchyRequest") requestWithBase64Data:[phase2JsonData base64EncodedStringWithOptions:0] error:error];
	RETURN_IF_NIL(phase2Request);
	NSData* phase2ResponseData = [sharedHub performRequest:phase2Request error:error];
	RETURN_IF_NIL(phase2ResponseData);
	RETURN_IF_FALSE([phase2ResponseData writeToURL:[requestResponses URLByAppendingPathComponent:@"Response_1"] options:NSDataWritingAtomic error:error]);
	
//	NSDictionary* phase2Response = [NSJSONSerialization JSONObjectWithData:phase2ResponseData options:0 error:error];
//	RETURN_IF_NIL(phase2Response);
	
	NSDictionary* phase3Dictionary = @{
		@"DBGHierarchyRequestName": @"Fetch remaining lazy properties",
		@"DBGHierarchyRequestInitiatorVersionKey": @3,
		@"DBGHierarchyRequestPriority": @0,
		@"DBGHierarchyObjectDiscovery": @2,
		@"DBGHierarchyRequestActions": @[
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"encodedPresentationLayer",
							@"encodedPresentationScene",
							@"dbgFormattedDisplayName",
							@"snapshotImage",
							@"snapshotImageRenderedUsingDrawHierarchyInRect",
							@"visualRepresentation",
							@"dbgSubviewHierarchy"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": NSNull.null,
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyAction",
					@"propertyNamesAreExclusive": @1
				},
				@{
					@"objectIdentifiers": NSNull.null,
					@"options": @0,
					@"propertyNames": @[
							@"encodedPresentationLayer",
							@"encodedPresentationScene",
							@"dbgFormattedDisplayName",
							@"snapshotImage",
							@"snapshotImageRenderedUsingDrawHierarchyInRect",
							@"visualRepresentation",
							@"dbgSubviewHierarchy"
					],
					@"exactTypesAreExclusive": @0,
					@"optionsComparisonStyle": @0,
					@"exactTypes": NSNull.null,
					@"typesAreExclusive": @0,
					@"visibility": @15,
					@"types": NSNull.null,
					@"objectIdentifiersAreExclusive": @0,
					@"actionClass": @"DebugHierarchyPropertyActionLegacyV1",
					@"propertyNamesAreExclusive": @1
				}
		],
		@"DBGHierarchyRequestIdentifier": NSUUID.UUID.UUIDString,
		@"DBGHierarchyRequestTransportCompression": @YES
	};
	NSData* phase3JsonData = [NSJSONSerialization dataWithJSONObject:phase3Dictionary options:0 error:error];
	RETURN_IF_NIL(phase3JsonData);
	
	id phase3Request = [NSClassFromString(@"DebugHierarchyRequest") requestWithBase64Data:[phase3JsonData base64EncodedStringWithOptions:0] error:error];
	RETURN_IF_NIL(phase3Request);
	NSData* phase3ResponseData = [sharedHub performRequest:phase3Request error:error];
	RETURN_IF_NIL(phase3ResponseData);
	RETURN_IF_FALSE([phase3ResponseData writeToURL:[requestResponses URLByAppendingPathComponent:@"Response_2"] options:NSDataWritingAtomic error:error]);
	
//	NSDictionary* phase3Response = [NSJSONSerialization JSONObjectWithData:phase3ResponseData options:0 error:error];
//	RETURN_IF_NIL(phase3Response);
	
	NSDictionary* cleanupPhaseDictionary = @{
		@"DBGHierarchyRequestName": @"Cleanup",
		@"DBGHierarchyRequestInitiatorVersionKey": @3,
		@"DBGHierarchyRequestPriority": @0,
		@"DBGHierarchyObjectDiscovery": @0,
		@"DBGHierarchyRequestActions": @[
				@{
					@"actionClass": @"DebugHierarchyResetAction"
				}
		],
		@"DBGHierarchyRequestIdentifier": NSUUID.UUID.UUIDString,
		@"DBGHierarchyRequestTransportCompression": @NO
	};
	NSData* cleanupPhaseJsonData = [NSJSONSerialization dataWithJSONObject:cleanupPhaseDictionary options:0 error:error];
	RETURN_IF_NIL(phase3JsonData);
	
	id cleanupPhaseRequest = [NSClassFromString(@"DebugHierarchyRequest") requestWithBase64Data:[cleanupPhaseJsonData base64EncodedStringWithOptions:0] error:error];
	RETURN_IF_NIL(cleanupPhaseRequest);
	[sharedHub performRequest:cleanupPhaseRequest error:error];
	
	NSDictionary* metadata = @{
		@"DocumentVersion": @"1",
		@"RunnableDisplayName": [NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleName"],
		@"RunnablePID": @(NSProcessInfo.processInfo.processIdentifier)
	};
	
	NSData* data = [NSPropertyListSerialization dataWithPropertyList:metadata format:NSPropertyListXMLFormat_v1_0 options:0 error:error];
	if(data == nil)
	{
		return NO;
	}
	
	RETURN_IF_FALSE([data writeToURL:[URL URLByAppendingPathComponent:@"metadata"] options:NSDataWritingAtomic error:error]);
	
	return YES;
#endif
}

@end
