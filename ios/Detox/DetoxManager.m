//
//  DetoxManager.m
//  Detox
//
//  Created by Tal Kol on 6/15/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "DetoxManager.h"

@interface DetoxManager()

@property (nonatomic, retain) SRWebSocket *websocket;
@property (nonatomic, retain) NSString *sessionId;

@end


@implementation DetoxManager

+ (instancetype)sharedInstance
{
    static DetoxManager *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[DetoxManager alloc] init];
    });
    return sharedInstance;
}

+ (void) connectToServer:(NSString*)url withSessionId:(NSString*)sessionId
{
    [[DetoxManager sharedInstance] connectToServer:url withSessionId:sessionId];
}

- (void) connectToServer:(NSString*)url withSessionId:(NSString*)sessionId
{
    if (self.websocket)
    {
        [self.websocket close];
        self.websocket = nil;
    }
    self.sessionId = sessionId;
    self.websocket = [[SRWebSocket alloc] initWithURL:[NSURL URLWithString:url]];
    self.websocket.delegate = self;
    [self.websocket open];
}

- (void)webSocketDidOpen:(SRWebSocket *)webSocket
{
    [self.websocket sendString:self.sessionId];
}

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessageWithString:(NSString *)string
{
    NSLog(@"Detox Received message: %@", string);
}

- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error
{
    NSLog(@"Detox Error: %@", error);
}

- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
    NSLog(@"Detox Closed: %@", reason);
}

@end
