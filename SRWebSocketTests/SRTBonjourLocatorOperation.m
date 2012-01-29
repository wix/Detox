//
//  SRTBonjourLocatorOperation.m
//  SocketRocket
//
//  Created by Mike Lewis on 1/28/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "SRTBonjourLocatorOperation.h"

@interface SRTBonjourLocatorOperation () <NSNetServiceBrowserDelegate, NSNetServiceDelegate>

@property (nonatomic, readonly) BOOL isCancelled;
@property (nonatomic, readonly) BOOL isExecuting;
@property (nonatomic, readonly) BOOL isFinished;

@end

@implementation SRTBonjourLocatorOperation {
    NSMutableArray *_foundServices;
    NSNetServiceBrowser *_serviceBrowser;
    NSString *_key;
}

@synthesize isCancelled = _isCancelled;
@synthesize isExecuting = _isExecuting;
@synthesize isFinished = _isFinished;

@synthesize foundService = _foundService;
@synthesize foundScheme = _foundScheme;

- (id)initWithKey:(NSString *)key {
    self = [super init];
    if (self) {
        _foundServices = [[NSMutableArray alloc] init];
        _serviceBrowser = [[NSNetServiceBrowser alloc] init];
        _serviceBrowser.delegate = self;
        _key = key;
    }
    return self;
}

- (void)dealloc
{
    for (NSNetService *service in _foundServices) {
        service.delegate = nil;
    }
    
    _serviceBrowser.delegate = nil;
}

- (void)start;
{
    [super start];
    _isExecuting = YES;
    [_serviceBrowser searchForServicesOfType:@"_autbahn_ws._tcp" inDomain:@""];
}

- (BOOL)isConcurrent
{
    return YES;
}

#pragma mark NSNetServiceBrowserDelegate

- (void)netServiceBrowserDidStopSearch:(NSNetServiceBrowser *)aNetServiceBrowser;
{
    _isExecuting = NO;
    _isFinished = YES;
    NSLog(@"netServiceBrowserDidStopSearch stopped");
}

- (void)netServiceBrowser:(NSNetServiceBrowser *)aNetServiceBrowser didNotSearch:(NSDictionary *)errorDict;
{
    _isExecuting = NO;
    _isFinished = YES;
    NSLog(@"NetServiceBrowser stopped");
}

- (void)netServiceBrowser:(NSNetServiceBrowser *)aNetServiceBrowser didFindService:(NSNetService *)aNetService moreComing:(BOOL)moreComing;
{
    [_foundServices addObject:aNetService];
    aNetService.delegate = self;
    const float SRTResolveTimeout = 2.0f;
    [aNetService resolveWithTimeout:SRTResolveTimeout];
}

#pragma mark NSNetServiceDelegate
- (void)netService:(NSNetService *)sender didNotResolve:(NSDictionary *)errorDict;
{
    _isFinished = YES;
    _isExecuting = NO;
}

- (void)netServiceDidResolveAddress:(NSNetService *)sender;
{
    if (!_isFinished) {
        NSDictionary *txtRecordData = [NSNetService dictionaryFromTXTRecordData:sender.TXTRecordData];
        NSString *scheme = [[NSString alloc] initWithData:[txtRecordData valueForKey:@"scheme"] encoding:NSUTF8StringEncoding];
        NSString *key = [[NSString alloc] initWithData:[txtRecordData valueForKey:@"key"] encoding:NSUTF8StringEncoding];
        
        if ([key isEqualToString:_key]) {
            _foundService = sender;
            _foundScheme = scheme;

            _isFinished = YES;
            _isExecuting = NO;
        }
    }
}
@end
