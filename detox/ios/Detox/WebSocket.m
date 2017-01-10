//
//  WebSocket.m
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import "WebSocket.h"

@interface WebSocket()

@property (nonatomic, retain) NSString *sessionId;
@property (nonatomic, retain) SRWebSocket *websocket;

@end


@implementation WebSocket

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

- (void) sendAction:(NSString*)type withParams:(NSDictionary*)params
{
    NSDictionary *data = @{@"type": type, @"params": params};
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:data options:kNilOptions error:&error];
    if (jsonData == nil)
    {
        NSLog(@"☣️ DETOX:: Error: sendAction encode - %@", error);
        return;
    }
    NSLog(@"Detox Action Sent: %@", type);
    NSString *json = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    [self.websocket sendString:json error:NULL];
}

- (void) receiveAction:(NSString*)json
{
    NSError *error;
    NSData *jsonData = [json dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *data = [NSJSONSerialization JSONObjectWithData:jsonData options:kNilOptions error:&error];
    if (data == nil)
    {
        NSLog(@"☣️ DETOX:: Error: receiveAction decode - %@", error);
        return;
    }
    NSString *type = [data objectForKey:@"type"];
    if (type == nil)
    {
        NSLog(@"☣️ DETOX:: Error: receiveAction missing type");
        return;
    }
    NSDictionary *params = [data objectForKey:@"params"];
    if (params != nil && ![params isKindOfClass:[NSDictionary class]])
    {
        NSLog(@"☣️ DETOX:: Error: receiveAction invalid params");
        return;
    }
    NSLog(@"☣️ DETOX:: Detox Action Received: %@", type);
    if (self.delegate) [self.delegate websocketDidReceiveAction:type withParams:params];
}

- (void)webSocketDidOpen:(SRWebSocket *)webSocket
{
    [self sendAction:@"login" withParams:@{@"sessionId": self.sessionId, @"role": @"testee"}];
    if (self.delegate) [self.delegate websocketDidConnect];
}

- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessageWithString:(NSString *)string
{
    [self receiveAction:string];
}

- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error
{
    NSLog(@"☣️ DETOX:: Error: %@", error);
}

- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
    NSLog(@"☣️ DETOX:: Closed: %@", reason);
}

@end
