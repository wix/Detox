//
//  SRTWebSocketOperation.h
//  SocketRocket
//
//  Created by Mike Lewis on 1/28/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "SRWebSocket.h"

@interface SRTWebSocketOperation : NSOperation <SRWebSocketDelegate>

- (id)initWithURL:(NSURL *)URL;

@property (nonatomic) BOOL isFinished;
@property (nonatomic) BOOL isExecuting;

@property (nonatomic, readonly, retain) NSError *error;

// We override these methods.  Please call super
- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean;
- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error;

@end
