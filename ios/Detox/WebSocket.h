//
//  WebSocket.h
//  Detox
//
//  Created by Tal Kol on 6/16/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@class WebSocket;

@protocol WebSocketDelegate <NSObject>

- (void)webSocketDidConnect:(WebSocket*)webSocket;
- (void)webSocket:(WebSocket*)webSocket didFailWithError:(NSError*)error;
- (void)webSocket:(WebSocket*)webSocket didReceiveAction:(NSString*)type withParams:(NSDictionary*)params withMessageId:(NSNumber*)messageId;
- (void)webSocket:(WebSocket*)webSocket didCloseWithReason:(NSString*)reason;

@end


@interface WebSocket : NSObject

@property (nonatomic, assign) id<WebSocketDelegate> delegate;
- (void)connectToServer:(NSString*)url withSessionId:(NSString*)sessionId;
- (void)sendAction:(NSString*)type withParams:(NSDictionary*)params withMessageId:(NSNumber*)messageId;
- (void)close;

@end
