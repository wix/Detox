//
//   Copyright 2012 Square Inc.
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//

#import <Foundation/Foundation.h>

typedef enum {
    SR_CONNECTING   = 0,
    SR_OPEN         = 1,
    SR_CLOSING      = 2,
    SR_CLOSED       = 3,
    
} SRReadyState;

@class SRWebSocket;

typedef void (^SROnOpenHandler)(SRWebSocket *webSocket);
typedef void (^SROnMessageHandler)(SRWebSocket *webSocket, NSString *message);
typedef void (^SROnCloseHandler)(SRWebSocket *webSocket, NSInteger code, NSString *reason, BOOL wasClean);
typedef void (^SROnErrorHandler)(SRWebSocket *webSocket, NSError *error);

extern NSString *const SRWebSocketErrorDomain;

@protocol SRWebSocketDelegate;

@interface SRWebSocket : NSObject <NSStreamDelegate>

@property (nonatomic, assign) id <SRWebSocketDelegate> delegate;

@property (nonatomic, readonly) SRReadyState readyState;
@property (nonatomic, readonly, strong) NSURL *url;

- (id)initWithURLRequest:(NSURLRequest *)request;
- (void)connectToHost:(NSString *)host port:(NSInteger)port;

- (void)open;
- (void)close;
- (void)closeWithCode:(NSInteger)code reason:(NSString *)reason;

- (void)failWithError:(NSError *)error;

// Send a UTF8 String or Data
- (void)send:(id)data;

// Must not be set to nil
@property (nonatomic, copy) SROnOpenHandler onOpen;
@property (nonatomic, copy) SROnMessageHandler onMessage;
@property (nonatomic, copy) SROnCloseHandler onClose;
@property (nonatomic, copy) SROnErrorHandler onError;

@end

@protocol SRWebSocketDelegate <NSObject>
@optional

- (void)webSocketDidOpen:(SRWebSocket *)webSocket;
- (void)webSocket:(SRWebSocket *)webSocket didFailWithError:(NSError *)error;
- (void)webSocket:(SRWebSocket *)webSocket didReceiveMessage:(NSString *)message;
- (void)webSocket:(SRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean;

@end
