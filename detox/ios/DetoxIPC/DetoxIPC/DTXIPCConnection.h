//
//  DTXIPCConnection.h
//  DetoxIPC
//
//  Created by Leo Natan (Wix) on 9/24/19.
//  Copyright © 2019 LeoNatan. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface DTXIPCInterface : NSObject

+ (instancetype)interfaceWithProtocol:(Protocol *)protocol;
@property (nonatomic, assign) Protocol *protocol;

- (NSUInteger)numberOfMethods;


@end

@interface DTXIPCConnection : NSObject

+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithServiceName:(NSString*)serviceName;
@property (nullable, readonly, copy, nonatomic) NSString *serviceName;

- (instancetype)initWithRegisteredServiceName:(NSString*)serviceName;

@property(retain, nonatomic) DTXIPCInterface *exportedInterface;
@property(retain, nonatomic) id exportedObject;

@property(retain, nonatomic) DTXIPCInterface *remoteObjectInterface;
@property(readonly, retain, nonatomic) id remoteObjectProxy;
- (id)remoteObjectProxyWithErrorHandler:(void (^)(NSError *error))handler;
- (id)synchronousRemoteObjectProxyWithErrorHandler:(void (^)(NSError *error))handler;

- (void)invalidate;

@end

NS_ASSUME_NONNULL_END
