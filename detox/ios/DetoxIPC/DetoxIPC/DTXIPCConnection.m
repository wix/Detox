//
//  DTXIPCConnection.m
//  DetoxIPC
//
//  Created by Leo Natan (Wix) on 9/24/19.
//  Copyright © 2019 LeoNatan. All rights reserved.
//

#import "DTXIPCConnection.h"
#import "NSConnection.h"

@implementation DTXIPCInterface

+ (instancetype)interfaceWithProtocol:(Protocol *)protocol
{
	DTXIPCInterface* rv = [DTXIPCInterface new];
	rv.protocol = protocol;
	
	return rv;
}

@end

@implementation DTXIPCConnection
{
	BOOL _slave;
	
	NSConnection* _connection;
	NSConnection* _otherConnection;
}

- (instancetype)initWithServiceName:(NSString *)serviceName
{
	self = [super init];
	if(self)
	{
		_serviceName = serviceName;
		_slave = NO;
		
		_connection = [NSConnection connectionWithReceivePort:NSPort.port sendPort:nil];
		_connection.rootObject = self;
		[_connection registerName:_serviceName];
		[_connection runInNewThread];
	}
	return self;
}

- (void)_validateInterface:(DTXIPCInterface*)interface
{
	
}

- (void)setExportedInterface:(DTXIPCInterface *)exportedInterface
{
	[self _validateInterface:exportedInterface];
}

- (void)setRemoteObjectInterface:(DTXIPCInterface *)remoteObjectInterface
{
	[self _validateInterface:remoteObjectInterface];
}

- (instancetype)initWithRegisteredServiceName:(NSString *)serviceName
{
	self = [super init];
	if(self)
	{
		_serviceName = [NSString stringWithFormat:@"%@.slave", serviceName];
		_slave = YES;
		
		_connection = [NSConnection connectionWithReceivePort:NSPort.port sendPort:nil];
		_connection.rootObject = self;
		[_connection registerName:_serviceName];
		[_connection runInNewThread];
		
		_otherConnection = [NSConnection connectionWithRegisteredName:serviceName host:nil];
		[(id)_otherConnection.rootProxy _slaveDidConnectWithName:_serviceName];
	}
	return self;
}

- (void)invalidate
{
	[_connection invalidate];
	[(id)_otherConnection.rootProxy _remoteDidInvalidate];
	[_otherConnection invalidate];
}

- (id)remoteObjectProxyWithErrorHandler:(void (^)(NSError * _Nonnull))handler
{
	return nil;
}

- (id)synchronousRemoteObjectProxyWithErrorHandler:(void (^)(NSError * _Nonnull))handler
{
	return nil;
}

#pragma mark Slave notifications

- (oneway void)_slaveDidConnectWithName:(NSString*)slaveServiceName
{
	_otherConnection = [NSConnection connectionWithRegisteredName:slaveServiceName host:nil];
}

#pragma 

- (oneway void)_remoteDidInvalidate
{
	_otherConnection = nil;
	[_connection invalidate];
}

@end
