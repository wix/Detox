//
//  xpc_extensions.m
//  Detox
//
//  Created by Leo Natan (Wix) on 9/22/19.
//

#import "xpc_extensions.h"
@import ObjectiveC;

//NSData* _DTXSerializationDataForListenerEndpoint(NSXPCListenerEndpoint* endpoint)
//{
//	NSKeyedArchiver* archiver = [[NSKeyedArchiver alloc] initRequiringSecureCoding:NO];
//
//	id z = [endpoint valueForKey:@"endpoint"];
//	size_t obj_size = malloc_size((__bridge void*)z);
//	size_t instance_size = class_getInstanceSize([z class]);
//	size_t extraBytes = obj_size - instance_size;
//	NSData* obj_data = [NSData dataWithBytes:(__bridge void*)z length:obj_size];
//
//	[archiver encodeObject:obj_data forKey:@"data"];
//	[archiver encodeObject:@(obj_size) forKey:@"obj_size"];
//	[archiver encodeObject:@(instance_size) forKey:@"instance_size"];
//	[archiver encodeObject:@(extraBytes) forKey:@"extraBytes"];
//	[archiver encodeObject:NSStringFromClass([z class]) forKey:@"class"];
//
//	return [archiver encodedData];
//}
//
//NSXPCListenerEndpoint* _DTXListenerEndpointFromSerializationData(NSData* data)
//{
//	NSKeyedUnarchiver* unarchiver = [[NSKeyedUnarchiver alloc] initForReadingWithData:data];
//
//	Class cls = NSClassFromString([unarchiver decodeObjectForKey:@"class"]);
//	size_t extraBytes = [[unarchiver decodeObjectForKey:@"extraBytes"] unsignedLongLongValue];
//	size_t obj_size = [[unarchiver decodeObjectForKey:@"obj_size"] unsignedLongLongValue];
//	NSData* obj_data = [unarchiver decodeObjectForKey:@"data"];
//
//	id a = class_createInstance(cls, extraBytes);
//	[obj_data getBytes:(__bridge void*)a length:obj_size];
//
//	NSXPCListenerEndpoint* endpoint = [NSXPCListenerEndpoint new];
//	[endpoint setValue:a forKey:@"endpoint"];
//
//	return endpoint;
//}
