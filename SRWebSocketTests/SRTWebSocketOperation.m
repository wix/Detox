//
//  SRTWebSocketOperation.m
//  SocketRocket
//
//  Created by Mike Lewis on 1/28/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "SRTWebSocketOperation.h"
#import "SRWebSocket.h"

@interface SRTWebSocketOperation ()

@end

@implementation SRTWebSocketOperation {
    NSInteger _testNumber;
    SRWebSocket *_webSocket;
    NSURL *_url;
}

@synthesize isFinished = _isFinished;
@synthesize isExecuting = _isExecuting;
@synthesize error = _error;

- (id)initWithURL:(NSURL *)URL;
{
    self = [super init];
    if (self) {
        _url = URL;
        _isExecuting = NO;
        _isFinished = NO;
    }
    return self;
}

- (BOOL)isConcurrent;
{
    return YES;
}

- (void)start;
{
    dispatch_async(dispatch_get_main_queue(), ^{
        _webSocket = [[SRWebSocket alloc] initWithURLRequest:[NSURLRequest requestWithURL:_url]];
        _webSocket.delegate = self;
        [_webSocket open];
    });
    self.isExecuting = YES;
}

- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean;
{
    [self willChangeValueForKey:@"isExecuting"];
    [self willChangeValueForKey:@"isFinished"];
    _isFinished = YES;
    _isExecuting = NO;
    [self didChangeValueForKey:@"isExecuting"];
    [self didChangeValueForKey:@"isFinished"];
    _webSocket.delegate = nil;
    _webSocket = nil;
}

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(id)message;
{
    NSAssert(NO, @"Not implemented");
}

- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error;
{
    _error = error;
    [self willChangeValueForKey:@"isExecuting"];
    [self willChangeValueForKey:@"isFinished"];
    _isFinished = YES;
    _isExecuting = NO;
    [self didChangeValueForKey:@"isExecuting"];
    [self didChangeValueForKey:@"isFinished"];
    _webSocket.delegate = nil;
    _webSocket = nil;
}

@end
