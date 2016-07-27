//
// Copyright 2012 Square Inc.
// Portions Copyright (c) 2016-present, Facebook, Inc.
//
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree. An additional grant
// of patent rights can be found in the PATENTS file in the same directory.
//

#import "SRWebSocket.h"

#if TARGET_OS_IPHONE
#define HAS_ICU
#endif

#ifdef HAS_ICU
#import <unicode/utf8.h>
#endif

#if TARGET_OS_IPHONE
#import <Endian.h>
#else
#import <CoreServices/CoreServices.h>
#endif

#import <Security/SecRandom.h>

#import "SRDelegateController.h"
#import "SRIOConsumer.h"
#import "SRIOConsumerPool.h"
#import "SRHash.h"
#import "SRURLUtilities.h"
#import "SRError.h"
#import "NSURLRequest+SRWebSocket.h"
#import "NSRunLoop+SRWebSocket.h"
#import "SRProxyConnect.h"
#import "SRSecurityOptions.h"

#if !__has_feature(objc_arc)
#error SocketRocket must be compiled with ARC enabled
#endif

/**
 Default buffer size that is used for reading/writing to streams.
 */
static size_t SRDefaultBufferSize(void) {
    static size_t size;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        size = getpagesize();
    });
    return size;
}

typedef enum  {
    SROpCodeTextFrame = 0x1,
    SROpCodeBinaryFrame = 0x2,
    // 3-7 reserved.
    SROpCodeConnectionClose = 0x8,
    SROpCodePing = 0x9,
    SROpCodePong = 0xA,
    // B-F reserved.
} SROpCode;

typedef struct {
    BOOL fin;
    //  BOOL rsv1;
    //  BOOL rsv2;
    //  BOOL rsv3;
    uint8_t opcode;
    BOOL masked;
    uint64_t payload_length;
} frame_header;

static NSString *const SRWebSocketAppendToSecKeyString = @"258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

static inline int32_t validate_dispatch_data_partial_string(NSData *data);
static inline void SRFastLog(NSString *format, ...);

static uint8_t const SRWebSocketProtocolVersion = 13;

NSString *const SRWebSocketErrorDomain = @"SRWebSocketErrorDomain";
NSString *const SRHTTPResponseErrorKey = @"HTTPResponseStatusCode";

@interface SRWebSocket ()  <NSStreamDelegate>

@property (nonatomic, assign, readwrite) SRReadyState readyState;

// Specifies whether SSL trust chain should NOT be evaluated.
// By default this flag is set to NO, meaning only secure SSL connections are allowed.
// For DEBUG builds this flag is ignored, and SSL connections are allowed regardless
// of the certificate trust configuration
@property (nonatomic, assign, readwrite) BOOL allowsUntrustedSSLCertificates;

@property (nonatomic, strong, readonly) SRDelegateController *delegateController;

@end

@implementation SRWebSocket {
    dispatch_queue_t _workQueue;
    NSMutableArray<SRIOConsumer *> *_consumers;

    NSInputStream *_inputStream;
    NSOutputStream *_outputStream;

    dispatch_data_t _readBuffer;
    NSUInteger _readBufferOffset;

    dispatch_data_t _outputBuffer;
    NSUInteger _outputBufferOffset;

    uint8_t _currentFrameOpcode;
    size_t _currentFrameCount;
    size_t _readOpCount;
    uint32_t _currentStringScanPosition;
    NSMutableData *_currentFrameData;

    NSString *_closeReason;

    NSString *_secKey;

    SRSecurityOptions *_securityOptions;
    BOOL _streamSecurityValidated;

    uint8_t _currentReadMaskKey[4];
    size_t _currentReadMaskOffset;

    BOOL _closeWhenFinishedWriting;
    BOOL _failed;

    NSURLRequest *_urlRequest;

    BOOL _sentClose;
    BOOL _didFail;
    BOOL _cleanupScheduled;
    int _closeCode;

    BOOL _isPumping;

    NSMutableSet<NSArray *> *_scheduledRunloops; // Set<[RunLoop, Mode]>. TODO: (nlutsenko) Fix clowntown

    // We use this to retain ourselves.
    __strong SRWebSocket *_selfRetain;

    NSArray<NSString *> *_requestedProtocols;
    SRIOConsumerPool *_consumerPool;

    // proxy support
    SRProxyConnect *_proxyConnect;
}

- (instancetype)initWithURLRequest:(NSURLRequest *)request protocols:(NSArray<NSString *> *)protocols allowsUntrustedSSLCertificates:(BOOL)allowsUntrustedSSLCertificates
{
    self = [super init];
    if (!self) return self;

    assert(request.URL);
    _url = request.URL;
    _urlRequest = request;
    _allowsUntrustedSSLCertificates = allowsUntrustedSSLCertificates;

    _requestedProtocols = [protocols copy];

    _securityOptions = [[SRSecurityOptions alloc] initWithRequest:request
                                               pinnedCertificates:request.SR_SSLPinnedCertificates
                                           chainValidationEnabled:allowsUntrustedSSLCertificates];

    _readyState = SR_CONNECTING;

    _workQueue = dispatch_queue_create(NULL, DISPATCH_QUEUE_SERIAL);

    // Going to set a specific on the queue so we can validate we're on the work queue
    dispatch_queue_set_specific(_workQueue, (__bridge void *)self, (__bridge void *)(_workQueue), NULL);

    _delegateController = [[SRDelegateController alloc] init];

    _readBuffer = dispatch_data_empty;
    _outputBuffer = dispatch_data_empty;

    _currentFrameData = [[NSMutableData alloc] init];

    _consumers = [[NSMutableArray alloc] init];

    _consumerPool = [[SRIOConsumerPool alloc] init];

    _scheduledRunloops = [[NSMutableSet alloc] init];

    return self;
}

- (instancetype)initWithURLRequest:(NSURLRequest *)request protocols:(NSArray<NSString *> *)protocols
{
    return [self initWithURLRequest:request protocols:protocols allowsUntrustedSSLCertificates:NO];
}

- (instancetype)initWithURLRequest:(NSURLRequest *)request
{
    return [self initWithURLRequest:request protocols:nil];
}

- (instancetype)initWithURL:(NSURL *)url;
{
    return [self initWithURL:url protocols:nil];
}

- (instancetype)initWithURL:(NSURL *)url protocols:(NSArray<NSString *> *)protocols;
{
    return [self initWithURL:url protocols:protocols allowsUntrustedSSLCertificates:NO];
}

- (instancetype)initWithURL:(NSURL *)url protocols:(NSArray<NSString *> *)protocols allowsUntrustedSSLCertificates:(BOOL)allowsUntrustedSSLCertificates
{
    NSURLRequest *request = [NSURLRequest requestWithURL:url];
    return [self initWithURLRequest:request protocols:protocols allowsUntrustedSSLCertificates:allowsUntrustedSSLCertificates];
}

- (void)assertOnWorkQueue;
{
    assert(dispatch_get_specific((__bridge void *)self) == (__bridge void *)_workQueue);
}

- (void)dealloc
{
    _inputStream.delegate = nil;
    _outputStream.delegate = nil;

    [_inputStream close];
    [_outputStream close];

    if (_receivedHTTPHeaders) {
        CFRelease(_receivedHTTPHeaders);
        _receivedHTTPHeaders = NULL;
    }
}

#ifndef NDEBUG

- (void)setReadyState:(SRReadyState)aReadyState;
{
    assert(aReadyState > _readyState);
    _readyState = aReadyState;
}

#endif

- (void)open;
{
    assert(_url);
    NSAssert(_readyState == SR_CONNECTING, @"Cannot call -(void)open on SRWebSocket more than once");

    _selfRetain = self;

    if (_urlRequest.timeoutInterval > 0)
    {
        dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, _urlRequest.timeoutInterval * NSEC_PER_SEC);
        dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
            if (self.readyState == SR_CONNECTING) {
                NSError *error = SRErrorWithDomainCodeDescription(NSURLErrorDomain, NSURLErrorTimedOut, @"Timed out connecting to server.");
                [self _failWithError:error];
            }
        });
    }

    [self openConnection];
}

- (BOOL)_checkHandshake:(CFHTTPMessageRef)httpMessage;
{
    NSString *acceptHeader = CFBridgingRelease(CFHTTPMessageCopyHeaderFieldValue(httpMessage, CFSTR("Sec-WebSocket-Accept")));

    if (acceptHeader == nil) {
        return NO;
    }

    NSString *concattedString = [_secKey stringByAppendingString:SRWebSocketAppendToSecKeyString];
    NSData *hashedString = SRSHA1HashFromString(concattedString);
    NSString *expectedAccept = SRBase64EncodedStringFromData(hashedString);
    return [acceptHeader isEqualToString:expectedAccept];
}

- (void)_HTTPHeadersDidFinish;
{
    NSInteger responseCode = CFHTTPMessageGetResponseStatusCode(_receivedHTTPHeaders);
    if (responseCode >= 400) {
        SRFastLog(@"Request failed with response code %d", responseCode);
        NSError *error = SRHTTPErrorWithCodeDescription(responseCode, 2132,
                                                        [NSString stringWithFormat:@"Received bad response code from server: %d.",
                                                         (int)responseCode]);
        [self _failWithError:error];
        return;
    }

    if(![self _checkHandshake:_receivedHTTPHeaders]) {
        NSError *error = SRErrorWithCodeDescription(2133, @"Invalid Sec-WebSocket-Accept response.");
        [self _failWithError:error];
        return;
    }

    NSString *negotiatedProtocol = CFBridgingRelease(CFHTTPMessageCopyHeaderFieldValue(_receivedHTTPHeaders, CFSTR("Sec-WebSocket-Protocol")));
    if (negotiatedProtocol) {
        // Make sure we requested the protocol
        if ([_requestedProtocols indexOfObject:negotiatedProtocol] == NSNotFound) {
            NSError *error = SRErrorWithCodeDescription(2133, @"Server specified Sec-WebSocket-Protocol that wasn't requested.");
            [self _failWithError:error];
            return;
        }

        _protocol = negotiatedProtocol;
    }

    self.readyState = SR_OPEN;

    if (!_didFail) {
        [self _readFrameNew];
    }

    [self.delegateController performDelegateBlock:^(id<SRWebSocketDelegate>  _Nullable delegate, SRDelegateAvailableMethods availableMethods) {
        if (availableMethods.didOpen) {
            [delegate webSocketDidOpen:self];
        }
    }];
}


- (void)_readHTTPHeader;
{
    if (_receivedHTTPHeaders == NULL) {
        _receivedHTTPHeaders = CFHTTPMessageCreateEmpty(NULL, NO);
    }

    [self _readUntilHeaderCompleteWithCallback:^(SRWebSocket *self,  NSData *data) {
        CFHTTPMessageAppendBytes(_receivedHTTPHeaders, (const UInt8 *)data.bytes, data.length);

        if (CFHTTPMessageIsHeaderComplete(_receivedHTTPHeaders)) {
            SRFastLog(@"Finished reading headers %@", CFBridgingRelease(CFHTTPMessageCopyAllHeaderFields(_receivedHTTPHeaders)));
            [self _HTTPHeadersDidFinish];
        } else {
            [self _readHTTPHeader];
        }
    }];
}

- (void)didConnect;
{
    SRFastLog(@"Connected");
    CFHTTPMessageRef request = CFHTTPMessageCreateRequest(NULL, CFSTR("GET"), (__bridge CFURLRef)_url, kCFHTTPVersion1_1);

    // Set host first so it defaults
    CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Host"), (__bridge CFStringRef)(_url.port ? [NSString stringWithFormat:@"%@:%@", _url.host, _url.port] : _url.host));

    NSMutableData *keyBytes = [[NSMutableData alloc] initWithLength:16];
    int result = SecRandomCopyBytes(kSecRandomDefault, keyBytes.length, keyBytes.mutableBytes);
    if (result != 0) {
        //TODO: (nlutsenko) Check if there was an error.
    }

    if ([keyBytes respondsToSelector:@selector(base64EncodedStringWithOptions:)]) {
        _secKey = [keyBytes base64EncodedStringWithOptions:0];
    } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        _secKey = [keyBytes base64Encoding];
#pragma clang diagnostic pop
    }

    assert([_secKey length] == 24);

    // Apply cookies if any have been provided
    NSDictionary<NSString *, NSString *> *cookies = [NSHTTPCookie requestHeaderFieldsWithCookies:self.requestCookies];
    [cookies enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull key, NSString * _Nonnull obj, BOOL * _Nonnull stop) {
        if (key.length && obj.length) {
            CFHTTPMessageSetHeaderFieldValue(request, (__bridge CFStringRef)key, (__bridge CFStringRef)obj);
        }
    }];

    // set header for http basic auth
    NSString *basicAuthorizationString = SRBasicAuthorizationHeaderFromURL(_url);
    if (basicAuthorizationString) {
        CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Authorization"), (__bridge CFStringRef)basicAuthorizationString);
    }

    CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Upgrade"), CFSTR("websocket"));
    CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Connection"), CFSTR("Upgrade"));
    CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Sec-WebSocket-Key"), (__bridge CFStringRef)_secKey);
    CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Sec-WebSocket-Version"), (__bridge CFStringRef)@(SRWebSocketProtocolVersion).stringValue);

    CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Origin"), (__bridge CFStringRef)SRURLOrigin(_url));

    if (_requestedProtocols) {
        CFHTTPMessageSetHeaderFieldValue(request, CFSTR("Sec-WebSocket-Protocol"), (__bridge CFStringRef)[_requestedProtocols componentsJoinedByString:@", "]);
    }

    [_urlRequest.allHTTPHeaderFields enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
        CFHTTPMessageSetHeaderFieldValue(request, (__bridge CFStringRef)key, (__bridge CFStringRef)obj);
    }];

    NSData *message = CFBridgingRelease(CFHTTPMessageCopySerializedMessage(request));

    CFRelease(request);

    [self _writeData:message];
    [self _readHTTPHeader];
}

- (void)_updateSecureStreamOptions
{
    SRFastLog(@"Setting up security for streams.");
    [_securityOptions updateSecurityOptionsInStream:_inputStream];
    [_securityOptions updateSecurityOptionsInStream:_outputStream];

    SRFastLog(@"Allows connection any root cert: %d", _securityOptions.validatesCertificateChain);
    SRFastLog(@"Pinned cert count: %d", _securityOptions.pinnedCertificates.count);

    _inputStream.delegate = self;
    _outputStream.delegate = self;

    [self setupNetworkServiceType:_urlRequest.networkServiceType];
}

- (void)setupNetworkServiceType:(NSURLRequestNetworkServiceType)requestNetworkServiceType
{
    NSString *networkServiceType;
    switch (requestNetworkServiceType) {
        case NSURLNetworkServiceTypeDefault:
            break;
        case NSURLNetworkServiceTypeVoIP: {
            networkServiceType = NSStreamNetworkServiceTypeVoIP;
#if TARGET_OS_IPHONE && __IPHONE_9_0
            if (floor(NSFoundationVersionNumber) > NSFoundationVersionNumber_iOS_8_3) {
                static dispatch_once_t predicate;
                dispatch_once(&predicate, ^{
                    NSLog(@"SocketRocket: %@ - this service type is deprecated in favor of using PushKit for VoIP control", networkServiceType);
                });
            }
#endif
            break;
        }
        case NSURLNetworkServiceTypeVideo:
            networkServiceType = NSStreamNetworkServiceTypeVideo;
            break;
        case NSURLNetworkServiceTypeBackground:
            networkServiceType = NSStreamNetworkServiceTypeBackground;
            break;
        case NSURLNetworkServiceTypeVoice:
            networkServiceType = NSStreamNetworkServiceTypeVoice;
            break;
    }

    if (networkServiceType != nil) {
        [_inputStream setProperty:networkServiceType forKey:NSStreamNetworkServiceType];
        [_outputStream setProperty:networkServiceType forKey:NSStreamNetworkServiceType];
    }
}

- (void)openConnection;
{
    _proxyConnect = [[SRProxyConnect alloc] initWithURL:_url];

    __weak typeof(self) wself = self;
    [_proxyConnect openNetworkStreamWithCompletion:^(NSError *error, NSInputStream *readStream, NSOutputStream *writeStream) {
        [wself _connectionDoneWithError:error readStream:readStream writeStream:writeStream];
    }];
}

- (void)_connectionDoneWithError:(NSError *)error readStream:(NSInputStream *)readStream writeStream:(NSOutputStream *)writeStream
{
    _proxyConnect = nil; // Job's done! This is not longer required.

    if (error != nil) {
        [self _failWithError:error];
    } else {
        _outputStream = writeStream;
        _inputStream = readStream;

        _inputStream.delegate = self;
        _outputStream.delegate = self;
        [self _updateSecureStreamOptions];

        if (!_scheduledRunloops.count) {
            [self scheduleInRunLoop:[NSRunLoop SR_networkRunLoop] forMode:NSDefaultRunLoopMode];
        }

        // If we don't require SSL validation - consider that we connected.
        // Otherwise `didConnect` is called when SSL validation finishes.
        if (!_securityOptions.requestRequiresSSL) {
            dispatch_async(_workQueue, ^{
                [self didConnect];
            });
        }
    }
}

- (void)scheduleInRunLoop:(NSRunLoop *)aRunLoop forMode:(NSString *)mode;
{
    [_outputStream scheduleInRunLoop:aRunLoop forMode:mode];
    [_inputStream scheduleInRunLoop:aRunLoop forMode:mode];

    [_scheduledRunloops addObject:@[aRunLoop, mode]];
}

- (void)unscheduleFromRunLoop:(NSRunLoop *)aRunLoop forMode:(NSString *)mode;
{
    [_outputStream removeFromRunLoop:aRunLoop forMode:mode];
    [_inputStream removeFromRunLoop:aRunLoop forMode:mode];

    [_scheduledRunloops removeObject:@[aRunLoop, mode]];
}

- (void)close;
{
    [self closeWithCode:SRStatusCodeNormal reason:nil];
}

- (void)closeWithCode:(NSInteger)code reason:(NSString *)reason;
{
    assert(code);
    dispatch_async(_workQueue, ^{
        if (self.readyState == SR_CLOSING || self.readyState == SR_CLOSED) {
            return;
        }

        BOOL wasConnecting = self.readyState == SR_CONNECTING;

        self.readyState = SR_CLOSING;

        SRFastLog(@"Closing with code %d reason %@", code, reason);

        if (wasConnecting) {
            [self closeConnection];
            return;
        }

        size_t maxMsgSize = [reason maximumLengthOfBytesUsingEncoding:NSUTF8StringEncoding];
        NSMutableData *mutablePayload = [[NSMutableData alloc] initWithLength:sizeof(uint16_t) + maxMsgSize];
        NSData *payload = mutablePayload;

        ((uint16_t *)mutablePayload.mutableBytes)[0] = EndianU16_BtoN(code);

        if (reason) {
            NSRange remainingRange = {0};

            NSUInteger usedLength = 0;

            BOOL success = [reason getBytes:(char *)mutablePayload.mutableBytes + sizeof(uint16_t) maxLength:payload.length - sizeof(uint16_t) usedLength:&usedLength encoding:NSUTF8StringEncoding options:NSStringEncodingConversionExternalRepresentation range:NSMakeRange(0, reason.length) remainingRange:&remainingRange];
#pragma unused (success)

            assert(success);
            assert(remainingRange.length == 0);

            if (usedLength != maxMsgSize) {
                payload = [payload subdataWithRange:NSMakeRange(0, usedLength + sizeof(uint16_t))];
            }
        }


        [self _sendFrameWithOpcode:SROpCodeConnectionClose data:payload];
    });
}

- (void)_closeWithProtocolError:(NSString *)message;
{
    // Need to shunt this on the _callbackQueue first to see if they received any messages
    [self.delegateController performDelegateQueueBlock:^{
        [self closeWithCode:SRStatusCodeProtocolError reason:message];
        dispatch_async(_workQueue, ^{
            [self closeConnection];
        });
    }];
}

- (void)_failWithError:(NSError *)error;
{
    dispatch_async(_workQueue, ^{
        if (self.readyState != SR_CLOSED) {
            _failed = YES;
            [self.delegateController performDelegateBlock:^(id<SRWebSocketDelegate>  _Nullable delegate, SRDelegateAvailableMethods availableMethods) {
                if (availableMethods.didFailWithError) {
                    [delegate webSocket:self didFailWithError:error];
                }
            }];

            self.readyState = SR_CLOSED;

            SRFastLog(@"Failing with error %@", error.localizedDescription);

            [self closeConnection];
            [self _scheduleCleanup];
        }
    });
}

- (void)_writeData:(NSData *)data;
{
    [self assertOnWorkQueue];

    if (_closeWhenFinishedWriting) {
        return;
    }

    __block NSData *strongData = data;
    dispatch_data_t newData = dispatch_data_create(data.bytes, data.length, nil, ^{
        strongData = nil;
    });
    _outputBuffer = dispatch_data_create_concat(_outputBuffer, newData);
    [self _pumpWriting];
}

- (void)send:(nullable id)message
{
    if (!message) {
        [self sendData:nil]; // Send Data, but it doesn't matter since we are going to send the same text frame with 0 length.
    } else if ([message isKindOfClass:[NSString class]]) {
        [self sendString:message];
    } else if ([message isKindOfClass:[NSData class]]) {
        [self sendData:message];
    } else {
        NSAssert(NO, @"Unrecognized message. Not able to send anything other than a String or NSData.");
    }
}

- (void)sendString:(NSString *)string
{
    NSAssert(self.readyState != SR_CONNECTING, @"Invalid State: Cannot call send: until connection is open");
    string = [string copy];
    dispatch_async(_workQueue, ^{
        [self _sendFrameWithOpcode:SROpCodeTextFrame data:[string dataUsingEncoding:NSUTF8StringEncoding]];
    });
}

- (void)sendData:(NSData *)data
{
    NSAssert(self.readyState != SR_CONNECTING, @"Invalid State: Cannot call send: until connection is open");
    data = [data copy];
    dispatch_async(_workQueue, ^{
        if (data) {
            [self _sendFrameWithOpcode:SROpCodeBinaryFrame data:data];
        } else {
            [self _sendFrameWithOpcode:SROpCodeTextFrame data:nil];
        }
    });
}

- (void)sendPing:(NSData *)data;
{
    NSAssert(self.readyState == SR_OPEN, @"Invalid State: Cannot call send: until connection is open");
    data = [data copy] ?: [NSData data]; // It's okay for a ping to be empty
    dispatch_async(_workQueue, ^{
        [self _sendFrameWithOpcode:SROpCodePing data:data];
    });
}

- (void)handlePing:(NSData *)pingData;
{
    // Need to pingpong this off _callbackQueue first to make sure messages happen in order
    [self.delegateController performDelegateQueueBlock:^{
        dispatch_async(_workQueue, ^{
            [self _sendFrameWithOpcode:SROpCodePong data:pingData];
        });
    }];
}

- (void)handlePong:(NSData *)pongData;
{
    SRFastLog(@"Received pong");
    [self.delegateController performDelegateBlock:^(id<SRWebSocketDelegate>  _Nullable delegate, SRDelegateAvailableMethods availableMethods) {
        if (availableMethods.didReceivePong) {
            [delegate webSocket:self didReceivePong:pongData];
        }
    }];
}


static inline BOOL closeCodeIsValid(int closeCode) {
    if (closeCode < 1000) {
        return NO;
    }

    if (closeCode >= 1000 && closeCode <= 1011) {
        if (closeCode == 1004 ||
            closeCode == 1005 ||
            closeCode == 1006) {
            return NO;
        }
        return YES;
    }

    if (closeCode >= 3000 && closeCode <= 3999) {
        return YES;
    }

    if (closeCode >= 4000 && closeCode <= 4999) {
        return YES;
    }

    return NO;
}

//  Note from RFC:
//
//  If there is a body, the first two
//  bytes of the body MUST be a 2-byte unsigned integer (in network byte
//  order) representing a status code with value /code/ defined in
//  Section 7.4.  Following the 2-byte integer the body MAY contain UTF-8
//  encoded data with value /reason/, the interpretation of which is not
//  defined by this specification.

- (void)handleCloseWithData:(NSData *)data;
{
    size_t dataSize = data.length;
    __block uint16_t closeCode = 0;

    SRFastLog(@"Received close frame");

    if (dataSize == 1) {
        // TODO handle error
        [self _closeWithProtocolError:@"Payload for close must be larger than 2 bytes"];
        return;
    } else if (dataSize >= 2) {
        [data getBytes:&closeCode length:sizeof(closeCode)];
        _closeCode = EndianU16_BtoN(closeCode);
        if (!closeCodeIsValid(_closeCode)) {
            [self _closeWithProtocolError:[NSString stringWithFormat:@"Cannot have close code of %d", _closeCode]];
            return;
        }
        if (dataSize > 2) {
            _closeReason = [[NSString alloc] initWithData:[data subdataWithRange:NSMakeRange(2, dataSize - 2)] encoding:NSUTF8StringEncoding];
            if (!_closeReason) {
                [self _closeWithProtocolError:@"Close reason MUST be valid UTF-8"];
                return;
            }
        }
    } else {
        _closeCode = SRStatusNoStatusReceived;
    }

    [self assertOnWorkQueue];

    if (self.readyState == SR_OPEN) {
        [self closeWithCode:1000 reason:nil];
    }
    dispatch_async(_workQueue, ^{
        [self closeConnection];
    });
}

- (void)closeConnection;
{
    [self assertOnWorkQueue];
    SRFastLog(@"Trying to disconnect");
    _closeWhenFinishedWriting = YES;
    [self _pumpWriting];
}

- (void)_handleFrameWithData:(NSData *)frameData opCode:(NSInteger)opcode;
{
    frameData = [frameData copy];
    // Check that the current data is valid UTF8

    BOOL isControlFrame = (opcode == SROpCodePing || opcode == SROpCodePong || opcode == SROpCodeConnectionClose);
    if (!isControlFrame) {
        [self _readFrameNew];
    } else {
        dispatch_async(_workQueue, ^{
            [self _readFrameContinue];
        });
    }

    //frameData will be copied before passing to handlers
    //otherwise there can be misbehaviours when value at the pointer is changed
    switch (opcode) {
        case SROpCodeTextFrame: {
            NSString *string = [[NSString alloc] initWithData:frameData encoding:NSUTF8StringEncoding];
            if (!string && frameData) {
                [self closeWithCode:SRStatusCodeInvalidUTF8 reason:@"Text frames must be valid UTF-8."];
                dispatch_async(_workQueue, ^{
                    [self closeConnection];
                });
                return;
            }
            SRFastLog(@"Received text message.");
            [self.delegateController performDelegateBlock:^(id<SRWebSocketDelegate>  _Nullable delegate, SRDelegateAvailableMethods availableMethods) {
                // Don't convert into string - iff `delegate` tells us not to. Otherwise - create UTF8 string and handle that.
                if (availableMethods.shouldConvertTextFrameToString && ![delegate webSocketShouldConvertTextFrameToString:self]) {
                    if (availableMethods.didReceiveMessage) {
                        [delegate webSocket:self didReceiveMessage:frameData];
                    }
                    if (availableMethods.didReceiveMessageWithData) {
                        [delegate webSocket:self didReceiveMessageWithData:frameData];
                    }
                } else {
                    if (availableMethods.didReceiveMessage) {
                        [delegate webSocket:self didReceiveMessage:string];
                    }
                    if (availableMethods.didReceiveMessageWithString) {
                        [delegate webSocket:self didReceiveMessageWithString:string];
                    }
                }
            }];
            break;
        }
        case SROpCodeBinaryFrame: {
            SRFastLog(@"Received data message.");
            [self.delegateController performDelegateBlock:^(id<SRWebSocketDelegate>  _Nullable delegate, SRDelegateAvailableMethods availableMethods) {
                if (availableMethods.didReceiveMessage) {
                    [delegate webSocket:self didReceiveMessage:frameData];
                }
                if (availableMethods.didReceiveMessageWithData) {
                    [delegate webSocket:self didReceiveMessageWithData:frameData];
                }
            }];
        }
            break;
        case SROpCodeConnectionClose:
            [self handleCloseWithData:frameData];
            break;
        case SROpCodePing:
            [self handlePing:frameData];
            break;
        case SROpCodePong:
            [self handlePong:frameData];
            break;
        default:
            [self _closeWithProtocolError:[NSString stringWithFormat:@"Unknown opcode %ld", (long)opcode]];
            // TODO: Handle invalid opcode
            break;
    }
}

- (void)_handleFrameHeader:(frame_header)frame_header curData:(NSData *)curData;
{
    assert(frame_header.opcode != 0);

    if (self.readyState == SR_CLOSED) {
        return;
    }


    BOOL isControlFrame = (frame_header.opcode == SROpCodePing || frame_header.opcode == SROpCodePong || frame_header.opcode == SROpCodeConnectionClose);

    if (isControlFrame && !frame_header.fin) {
        [self _closeWithProtocolError:@"Fragmented control frames not allowed"];
        return;
    }

    if (isControlFrame && frame_header.payload_length >= 126) {
        [self _closeWithProtocolError:@"Control frames cannot have payloads larger than 126 bytes"];
        return;
    }

    if (!isControlFrame) {
        _currentFrameOpcode = frame_header.opcode;
        _currentFrameCount += 1;
    }

    if (frame_header.payload_length == 0) {
        if (isControlFrame) {
            [self _handleFrameWithData:curData opCode:frame_header.opcode];
        } else {
            if (frame_header.fin) {
                [self _handleFrameWithData:_currentFrameData opCode:frame_header.opcode];
            } else {
                // TODO add assert that opcode is not a control;
                [self _readFrameContinue];
            }
        }
    } else {
        assert(frame_header.payload_length <= SIZE_T_MAX);
        [self _addConsumerWithDataLength:(size_t)frame_header.payload_length callback:^(SRWebSocket *self, NSData *newData) {
            if (isControlFrame) {
                [self _handleFrameWithData:newData opCode:frame_header.opcode];
            } else {
                if (frame_header.fin) {
                    [self _handleFrameWithData:self->_currentFrameData opCode:frame_header.opcode];
                } else {
                    // TODO add assert that opcode is not a control;
                    [self _readFrameContinue];
                }

            }
        } readToCurrentFrame:!isControlFrame unmaskBytes:frame_header.masked];
    }
}

/* From RFC:

 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-------+-+-------------+-------------------------------+
 |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
 |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
 |N|V|V|V|       |S|             |   (if payload len==126/127)   |
 | |1|2|3|       |K|             |                               |
 +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
 |     Extended payload length continued, if payload len == 127  |
 + - - - - - - - - - - - - - - - +-------------------------------+
 |                               |Masking-key, if MASK set to 1  |
 +-------------------------------+-------------------------------+
 | Masking-key (continued)       |          Payload Data         |
 +-------------------------------- - - - - - - - - - - - - - - - +
 :                     Payload Data continued ...                :
 + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
 |                     Payload Data continued ...                |
 +---------------------------------------------------------------+
 */

static const uint8_t SRFinMask          = 0x80;
static const uint8_t SROpCodeMask       = 0x0F;
static const uint8_t SRRsvMask          = 0x70;
static const uint8_t SRMaskMask         = 0x80;
static const uint8_t SRPayloadLenMask   = 0x7F;


- (void)_readFrameContinue;
{
    assert((_currentFrameCount == 0 && _currentFrameOpcode == 0) || (_currentFrameCount > 0 && _currentFrameOpcode > 0));

    [self _addConsumerWithDataLength:2 callback:^(SRWebSocket *self, NSData *data) {
        __block frame_header header = {0};

        const uint8_t *headerBuffer = data.bytes;
        assert(data.length >= 2);

        if (headerBuffer[0] & SRRsvMask) {
            [self _closeWithProtocolError:@"Server used RSV bits"];
            return;
        }

        uint8_t receivedOpcode = (SROpCodeMask & headerBuffer[0]);

        BOOL isControlFrame = (receivedOpcode == SROpCodePing || receivedOpcode == SROpCodePong || receivedOpcode == SROpCodeConnectionClose);

        if (!isControlFrame && receivedOpcode != 0 && self->_currentFrameCount > 0) {
            [self _closeWithProtocolError:@"all data frames after the initial data frame must have opcode 0"];
            return;
        }

        if (receivedOpcode == 0 && self->_currentFrameCount == 0) {
            [self _closeWithProtocolError:@"cannot continue a message"];
            return;
        }

        header.opcode = receivedOpcode == 0 ? self->_currentFrameOpcode : receivedOpcode;

        header.fin = !!(SRFinMask & headerBuffer[0]);


        header.masked = !!(SRMaskMask & headerBuffer[1]);
        header.payload_length = SRPayloadLenMask & headerBuffer[1];

        headerBuffer = NULL;

        if (header.masked) {
            [self _closeWithProtocolError:@"Client must receive unmasked data"];
            return;
        }

        size_t extra_bytes_needed = header.masked ? sizeof(_currentReadMaskKey) : 0;

        if (header.payload_length == 126) {
            extra_bytes_needed += sizeof(uint16_t);
        } else if (header.payload_length == 127) {
            extra_bytes_needed += sizeof(uint64_t);
        }

        if (extra_bytes_needed == 0) {
            [self _handleFrameHeader:header curData:self->_currentFrameData];
        } else {
            [self _addConsumerWithDataLength:extra_bytes_needed callback:^(SRWebSocket *self, NSData *data) {
                size_t mapped_size = data.length;
#pragma unused (mapped_size)
                const void *mapped_buffer = data.bytes;
                size_t offset = 0;

                if (header.payload_length == 126) {
                    assert(mapped_size >= sizeof(uint16_t));
                    uint16_t newLen = EndianU16_BtoN(*(uint16_t *)(mapped_buffer));
                    header.payload_length = newLen;
                    offset += sizeof(uint16_t);
                } else if (header.payload_length == 127) {
                    assert(mapped_size >= sizeof(uint64_t));
                    header.payload_length = EndianU64_BtoN(*(uint64_t *)(mapped_buffer));
                    offset += sizeof(uint64_t);
                } else {
                    assert(header.payload_length < 126 && header.payload_length >= 0);
                }

                if (header.masked) {
                    assert(mapped_size >= sizeof(_currentReadMaskOffset) + offset);
                    memcpy(self->_currentReadMaskKey, ((uint8_t *)mapped_buffer) + offset, sizeof(self->_currentReadMaskKey));
                }

                [self _handleFrameHeader:header curData:self->_currentFrameData];
            } readToCurrentFrame:NO unmaskBytes:NO];
        }
    } readToCurrentFrame:NO unmaskBytes:NO];
}

- (void)_readFrameNew;
{
    dispatch_async(_workQueue, ^{
        [_currentFrameData setLength:0];

        _currentFrameOpcode = 0;
        _currentFrameCount = 0;
        _readOpCount = 0;
        _currentStringScanPosition = 0;

        [self _readFrameContinue];
    });
}

- (void)_pumpWriting;
{
    [self assertOnWorkQueue];

    NSUInteger dataLength = dispatch_data_get_size(_outputBuffer);
    if (dataLength - _outputBufferOffset > 0 && _outputStream.hasSpaceAvailable) {
        __block NSInteger bytesWritten = 0;
        __block BOOL streamFailed = NO;

        dispatch_data_t dataToSend = dispatch_data_create_subrange(_outputBuffer, _outputBufferOffset, dataLength - _outputBufferOffset);
        dispatch_data_apply(dataToSend, ^bool(dispatch_data_t region, size_t offset, const void *buffer, size_t size) {
            NSInteger sentLength = [_outputStream write:buffer maxLength:size];
            if (sentLength == -1) {
                streamFailed = YES;
                return false;
            }
            bytesWritten += sentLength;
            return (sentLength >= (NSInteger)size); // If we can't write all the data into the stream - bail-out early.
        });
        if (streamFailed) {
            NSInteger code = 2145;
            NSString *description = @"Error writing to stream.";
            NSError *streamError = _outputStream.streamError;
            NSError *error = streamError ? SRErrorWithCodeDescriptionUnderlyingError(code, description, streamError) : SRErrorWithCodeDescription(code, description);
            [self _failWithError:error];
            return;
        }

        _outputBufferOffset += bytesWritten;

        if (_outputBufferOffset > SRDefaultBufferSize() && _outputBufferOffset > dataLength / 2) {
            _outputBuffer = dispatch_data_create_subrange(_outputBuffer, _outputBufferOffset, dataLength - _outputBufferOffset);
            _outputBufferOffset = 0;
        }
    }

    if (_closeWhenFinishedWriting &&
        (dispatch_data_get_size(_outputBuffer) - _outputBufferOffset) == 0 &&
        (_inputStream.streamStatus != NSStreamStatusNotOpen &&
         _inputStream.streamStatus != NSStreamStatusClosed) &&
        !_sentClose) {
        _sentClose = YES;

        @synchronized(self) {
            [_outputStream close];
            [_inputStream close];


            for (NSArray *runLoop in [_scheduledRunloops copy]) {
                [self unscheduleFromRunLoop:[runLoop objectAtIndex:0] forMode:[runLoop objectAtIndex:1]];
            }
        }

        if (!_failed) {
            [self.delegateController performDelegateBlock:^(id<SRWebSocketDelegate>  _Nullable delegate, SRDelegateAvailableMethods availableMethods) {
                if (availableMethods.didCloseWithCode) {
                    [delegate webSocket:self didCloseWithCode:_closeCode reason:_closeReason wasClean:YES];
                }
            }];
        }

        [self _scheduleCleanup];
    }
}

- (void)_addConsumerWithScanner:(stream_scanner)consumer callback:(data_callback)callback;
{
    [self assertOnWorkQueue];
    [self _addConsumerWithScanner:consumer callback:callback dataLength:0];
}

- (void)_addConsumerWithDataLength:(size_t)dataLength callback:(data_callback)callback readToCurrentFrame:(BOOL)readToCurrentFrame unmaskBytes:(BOOL)unmaskBytes;
{
    [self assertOnWorkQueue];
    assert(dataLength);

    [_consumers addObject:[_consumerPool consumerWithScanner:nil handler:callback bytesNeeded:dataLength readToCurrentFrame:readToCurrentFrame unmaskBytes:unmaskBytes]];
    [self _pumpScanner];
}

- (void)_addConsumerWithScanner:(stream_scanner)consumer callback:(data_callback)callback dataLength:(size_t)dataLength;
{
    [self assertOnWorkQueue];
    [_consumers addObject:[_consumerPool consumerWithScanner:consumer handler:callback bytesNeeded:dataLength readToCurrentFrame:NO unmaskBytes:NO]];
    [self _pumpScanner];
}


- (void)_scheduleCleanup
{
    @synchronized(self) {
        if (_cleanupScheduled) {
            return;
        }

        _cleanupScheduled = YES;

        // Cleanup NSStream delegate's in the same RunLoop used by the streams themselves:
        // This way we'll prevent race conditions between handleEvent and SRWebsocket's dealloc
        NSTimer *timer = [NSTimer timerWithTimeInterval:(0.0f) target:self selector:@selector(_cleanupSelfReference:) userInfo:nil repeats:NO];
        [[NSRunLoop SR_networkRunLoop] addTimer:timer forMode:NSDefaultRunLoopMode];
    }
}

- (void)_cleanupSelfReference:(NSTimer *)timer
{
    @synchronized(self) {
        // Nuke NSStream delegate's
        _inputStream.delegate = nil;
        _outputStream.delegate = nil;

        // Remove the streams, right now, from the networkRunLoop
        [_inputStream close];
        [_outputStream close];
    }

    // Cleanup selfRetain in the same GCD queue as usual
    dispatch_async(_workQueue, ^{
        _selfRetain = nil;
    });
}


static const char CRLFCRLFBytes[] = {'\r', '\n', '\r', '\n'};

- (void)_readUntilHeaderCompleteWithCallback:(data_callback)dataHandler;
{
    [self _readUntilBytes:CRLFCRLFBytes length:sizeof(CRLFCRLFBytes) callback:dataHandler];
}

- (void)_readUntilBytes:(const void *)bytes length:(size_t)length callback:(data_callback)dataHandler;
{
    // TODO optimize so this can continue from where we last searched
    stream_scanner consumer = ^size_t(NSData *data) {
        __block size_t found_size = 0;
        __block size_t match_count = 0;

        size_t size = data.length;
        const unsigned char *buffer = data.bytes;
        for (size_t i = 0; i < size; i++ ) {
            if (((const unsigned char *)buffer)[i] == ((const unsigned char *)bytes)[match_count]) {
                match_count += 1;
                if (match_count == length) {
                    found_size = i + 1;
                    break;
                }
            } else {
                match_count = 0;
            }
        }
        return found_size;
    };
    [self _addConsumerWithScanner:consumer callback:dataHandler];
}


// Returns true if did work
- (BOOL)_innerPumpScanner {

    BOOL didWork = NO;

    if (self.readyState >= SR_CLOSED) {
        return didWork;
    }

    size_t readBufferSize = dispatch_data_get_size(_readBuffer);

    if (!_consumers.count) {
        return didWork;
    }

    size_t curSize = readBufferSize - _readBufferOffset;
    if (!curSize) {
        return didWork;
    }

    SRIOConsumer *consumer = [_consumers objectAtIndex:0];

    size_t bytesNeeded = consumer.bytesNeeded;

    size_t foundSize = 0;
    if (consumer.consumer) {
        NSData *subdata = (NSData *)dispatch_data_create_subrange(_readBuffer, _readBufferOffset, readBufferSize - _readBufferOffset);
        foundSize = consumer.consumer(subdata);
    } else {
        assert(consumer.bytesNeeded);
        if (curSize >= bytesNeeded) {
            foundSize = bytesNeeded;
        } else if (consumer.readToCurrentFrame) {
            foundSize = curSize;
        }
    }

    if (consumer.readToCurrentFrame || foundSize) {
        dispatch_data_t slice = dispatch_data_create_subrange(_readBuffer, _readBufferOffset, foundSize);

        _readBufferOffset += foundSize;

        if (_readBufferOffset > SRDefaultBufferSize() && _readBufferOffset > readBufferSize / 2) {
            _readBuffer = dispatch_data_create_subrange(_readBuffer, _readBufferOffset, readBufferSize - _readBufferOffset);
            _readBufferOffset = 0;
        }

        if (consumer.unmaskBytes) {
            __block NSMutableData *mutableSlice = [slice mutableCopy];

            NSUInteger len = mutableSlice.length;
            uint8_t *bytes = mutableSlice.mutableBytes;

            for (NSUInteger i = 0; i < len; i++) {
                bytes[i] = bytes[i] ^ _currentReadMaskKey[_currentReadMaskOffset % sizeof(_currentReadMaskKey)];
                _currentReadMaskOffset += 1;
            }

            slice = dispatch_data_create(bytes, len, nil, ^{
                mutableSlice = nil;
            });
        }

        if (consumer.readToCurrentFrame) {
            dispatch_data_apply(slice, ^bool(dispatch_data_t region, size_t offset, const void *buffer, size_t size) {
                [_currentFrameData appendBytes:buffer length:size];
                return true;
            });

            _readOpCount += 1;

            if (_currentFrameOpcode == SROpCodeTextFrame) {
                // Validate UTF8 stuff.
                size_t currentDataSize = _currentFrameData.length;
                if (_currentFrameOpcode == SROpCodeTextFrame && currentDataSize > 0) {
                    // TODO: Optimize the crap out of this.  Don't really have to copy all the data each time

                    size_t scanSize = currentDataSize - _currentStringScanPosition;

                    NSData *scan_data = [_currentFrameData subdataWithRange:NSMakeRange(_currentStringScanPosition, scanSize)];
                    int32_t valid_utf8_size = validate_dispatch_data_partial_string(scan_data);

                    if (valid_utf8_size == -1) {
                        [self closeWithCode:SRStatusCodeInvalidUTF8 reason:@"Text frames must be valid UTF-8"];
                        dispatch_async(_workQueue, ^{
                            [self closeConnection];
                        });
                        return didWork;
                    } else {
                        _currentStringScanPosition += valid_utf8_size;
                    }
                }

            }

            consumer.bytesNeeded -= foundSize;

            if (consumer.bytesNeeded == 0) {
                [_consumers removeObjectAtIndex:0];
                consumer.handler(self, nil);
                [_consumerPool returnConsumer:consumer];
                didWork = YES;
            }
        } else if (foundSize) {
            [_consumers removeObjectAtIndex:0];
            consumer.handler(self, (NSData *)slice);
            [_consumerPool returnConsumer:consumer];
            didWork = YES;
        }
    }
    return didWork;
}

-(void)_pumpScanner;
{
    [self assertOnWorkQueue];

    if (!_isPumping) {
        _isPumping = YES;
    } else {
        return;
    }

    while ([self _innerPumpScanner]) {

    }

    _isPumping = NO;
}

//#define NOMASK

static const size_t SRFrameHeaderOverhead = 32;

- (void)_sendFrameWithOpcode:(SROpCode)opcode data:(id)data;
{
    [self assertOnWorkQueue];

    if (nil == data) {
        return;
    }

    NSAssert([data isKindOfClass:[NSData class]] || [data isKindOfClass:[NSString class]], @"NSString or NSData");

    size_t payloadLength = [data isKindOfClass:[NSString class]] ? [(NSString *)data lengthOfBytesUsingEncoding:NSUTF8StringEncoding] : [data length];

    NSMutableData *frame = [[NSMutableData alloc] initWithLength:payloadLength + SRFrameHeaderOverhead];
    if (!frame) {
        [self closeWithCode:SRStatusCodeMessageTooBig reason:@"Message too big"];
        return;
    }
    uint8_t *frame_buffer = (uint8_t *)[frame mutableBytes];

    // set fin
    frame_buffer[0] = SRFinMask | opcode;

    BOOL useMask = YES;
#ifdef NOMASK
    useMask = NO;
#endif

    if (useMask) {
        // set the mask and header
        frame_buffer[1] |= SRMaskMask;
    }

    size_t frame_buffer_size = 2;

    const uint8_t *unmasked_payload = NULL;
    if ([data isKindOfClass:[NSData class]]) {
        unmasked_payload = (uint8_t *)[data bytes];
    } else if ([data isKindOfClass:[NSString class]]) {
        unmasked_payload =  (const uint8_t *)[data UTF8String];
    } else {
        return;
    }

    if (payloadLength < 126) {
        frame_buffer[1] |= payloadLength;
    } else if (payloadLength <= UINT16_MAX) {
        frame_buffer[1] |= 126;
        *((uint16_t *)(frame_buffer + frame_buffer_size)) = EndianU16_BtoN((uint16_t)payloadLength);
        frame_buffer_size += sizeof(uint16_t);
    } else {
        frame_buffer[1] |= 127;
        *((uint64_t *)(frame_buffer + frame_buffer_size)) = EndianU64_BtoN((uint64_t)payloadLength);
        frame_buffer_size += sizeof(uint64_t);
    }

    if (!useMask) {
        for (size_t i = 0; i < payloadLength; i++) {
            frame_buffer[frame_buffer_size] = unmasked_payload[i];
            frame_buffer_size += 1;
        }
    } else {
        uint8_t *mask_key = frame_buffer + frame_buffer_size;
        int result = SecRandomCopyBytes(kSecRandomDefault, sizeof(uint32_t), (uint8_t *)mask_key);
        if (result != 0) {
            //TODO: (nlutsenko) Check if there was an error.
        }

        frame_buffer_size += sizeof(uint32_t);

        // TODO: could probably optimize this with SIMD
        for (size_t i = 0; i < payloadLength; i++) {
            frame_buffer[frame_buffer_size] = unmasked_payload[i] ^ mask_key[i % sizeof(uint32_t)];
            frame_buffer_size += 1;
        }
    }

    assert(frame_buffer_size <= [frame length]);
    frame.length = frame_buffer_size;

    [self _writeData:frame];
}

- (void)stream:(NSStream *)aStream handleEvent:(NSStreamEvent)eventCode
{
    __weak typeof(self) wself = self;

    if (_securityOptions.requestRequiresSSL && !_streamSecurityValidated &&
        (eventCode == NSStreamEventHasBytesAvailable || eventCode == NSStreamEventHasSpaceAvailable)) {
        SecTrustRef trust = (__bridge SecTrustRef)[aStream propertyForKey:(__bridge id)kCFStreamPropertySSLPeerTrust];
        if (trust) {
            _streamSecurityValidated = [_securityOptions securityTrustContainsPinnedCertificates:trust];
        }
        if (!_streamSecurityValidated) {
            dispatch_async(_workQueue, ^{
                NSError *error = SRErrorWithDomainCodeDescription(NSURLErrorDomain,
                                                                  NSURLErrorClientCertificateRejected,
                                                                  @"Invalid server certificate.");
                [wself _failWithError:error];
            });
            return;
        }
        dispatch_async(_workQueue, ^{
            [self didConnect];
        });
    }
    dispatch_async(_workQueue, ^{
        [wself safeHandleEvent:eventCode stream:aStream];
    });
}

- (void)safeHandleEvent:(NSStreamEvent)eventCode stream:(NSStream *)aStream
{
    switch (eventCode) {
        case NSStreamEventOpenCompleted: {
            SRFastLog(@"NSStreamEventOpenCompleted %@", aStream);
            if (self.readyState >= SR_CLOSING) {
                return;
            }
            assert(_readBuffer);

            if (!_securityOptions.requestRequiresSSL && self.readyState == SR_CONNECTING && aStream == _inputStream) {
                [self didConnect];
            }

            [self _pumpWriting];
            [self _pumpScanner];

            break;
        }

        case NSStreamEventErrorOccurred: {
            SRFastLog(@"NSStreamEventErrorOccurred %@ %@", aStream, [[aStream streamError] copy]);
            /// TODO specify error better!
            [self _failWithError:aStream.streamError];
            _readBufferOffset = 0;
            _readBuffer = dispatch_data_empty;
            break;

        }

        case NSStreamEventEndEncountered: {
            [self _pumpScanner];
            SRFastLog(@"NSStreamEventEndEncountered %@", aStream);
            if (aStream.streamError) {
                [self _failWithError:aStream.streamError];
            } else {
                dispatch_async(_workQueue, ^{
                    if (self.readyState != SR_CLOSED) {
                        self.readyState = SR_CLOSED;
                        [self _scheduleCleanup];
                    }

                    if (!_sentClose && !_failed) {
                        _sentClose = YES;
                        // If we get closed in this state it's probably not clean because we should be sending this when we send messages
                        [self.delegateController performDelegateBlock:^(id<SRWebSocketDelegate>  _Nullable delegate, SRDelegateAvailableMethods availableMethods) {
                            if (availableMethods.didCloseWithCode) {
                                [delegate webSocket:self
                                   didCloseWithCode:SRStatusCodeGoingAway
                                             reason:@"Stream end encountered"
                                           wasClean:NO];
                            }
                        }];
                    }
                });
            }

            break;
        }

        case NSStreamEventHasBytesAvailable: {
            SRFastLog(@"NSStreamEventHasBytesAvailable %@", aStream);
            uint8_t buffer[SRDefaultBufferSize()];

            while (_inputStream.hasBytesAvailable) {
                NSInteger bytesRead = [_inputStream read:buffer maxLength:SRDefaultBufferSize()];
                if (bytesRead > 0) {
                    dispatch_data_t data = dispatch_data_create(buffer, bytesRead, nil, DISPATCH_DATA_DESTRUCTOR_DEFAULT);
                    if (!data) {
                        NSError *error = SRErrorWithCodeDescription(SRStatusCodeMessageTooBig,
                                                                    @"Unable to allocate memory to read from socket.");
                        [self _failWithError:error];
                        return;
                    }
                    _readBuffer = dispatch_data_create_concat(_readBuffer, data);
                } else if (bytesRead == -1) {
                    [self _failWithError:_inputStream.streamError];
                }
            }
            [self _pumpScanner];
            break;
        }

        case NSStreamEventHasSpaceAvailable: {
            SRFastLog(@"NSStreamEventHasSpaceAvailable %@", aStream);
            [self _pumpWriting];
            break;
        }

        default:
            SRFastLog(@"(default)  %@", aStream);
            break;
    }
}

///--------------------------------------
#pragma mark - Delegate
///--------------------------------------

- (id<SRWebSocketDelegate> _Nullable)delegate
{
    return self.delegateController.delegate;
}

- (void)setDelegate:(id<SRWebSocketDelegate> _Nullable)delegate
{
    self.delegateController.delegate = delegate;
}

- (void)setDelegateDispatchQueue:(dispatch_queue_t _Nullable)queue
{
    self.delegateController.dispatchQueue = queue;
}

- (dispatch_queue_t _Nullable)delegateDispatchQueue
{
    return self.delegateController.dispatchQueue;
}

- (void)setDelegateOperationQueue:(NSOperationQueue *_Nullable)queue
{
    self.delegateController.operationQueue = queue;
}

- (NSOperationQueue *_Nullable)delegateOperationQueue
{
    return self.delegateController.operationQueue;
}

@end

//#define SR_ENABLE_LOG

static inline void SRFastLog(NSString *format, ...)  {
#ifdef SR_ENABLE_LOG
    __block va_list arg_list;
    va_start (arg_list, format);

    NSString *formattedString = [[NSString alloc] initWithFormat:format arguments:arg_list];

    va_end(arg_list);

    NSLog(@"[SR] %@", formattedString);
#endif
}


#ifdef HAS_ICU

static inline int32_t validate_dispatch_data_partial_string(NSData *data) {
    if ([data length] > INT32_MAX) {
        // INT32_MAX is the limit so long as this Framework is using 32 bit ints everywhere.
        return -1;
    }

    int32_t size = (int32_t)[data length];

    const void * contents = [data bytes];
    const uint8_t *str = (const uint8_t *)contents;

    UChar32 codepoint = 1;
    int32_t offset = 0;
    int32_t lastOffset = 0;
    while(offset < size && codepoint > 0)  {
        lastOffset = offset;
        U8_NEXT(str, offset, size, codepoint);
    }

    if (codepoint == -1) {
        // Check to see if the last byte is valid or whether it was just continuing
        if (!U8_IS_LEAD(str[lastOffset]) || U8_COUNT_TRAIL_BYTES(str[lastOffset]) + lastOffset < (int32_t)size) {
            
            size = -1;
        } else {
            uint8_t leadByte = str[lastOffset];
            U8_MASK_LEAD_BYTE(leadByte, U8_COUNT_TRAIL_BYTES(leadByte));
            
            for (int i = lastOffset + 1; i < offset; i++) {
                if (U8_IS_SINGLE(str[i]) || U8_IS_LEAD(str[i]) || !U8_IS_TRAIL(str[i])) {
                    size = -1;
                }
            }
            
            if (size != -1) {
                size = lastOffset;
            }
        }
    }
    
    if (size != -1 && ![[NSString alloc] initWithBytesNoCopy:(char *)[data bytes] length:size encoding:NSUTF8StringEncoding freeWhenDone:NO]) {
        size = -1;
    }
    
    return size;
}

#else

// This is a hack, and probably not optimal
static inline int32_t validate_dispatch_data_partial_string(NSData *data) {
    static const int maxCodepointSize = 3;
    
    for (int i = 0; i < maxCodepointSize; i++) {
        NSString *str = [[NSString alloc] initWithBytesNoCopy:(char *)data.bytes length:data.length - i encoding:NSUTF8StringEncoding freeWhenDone:NO];
        if (str) {
            return (int32_t)data.length - i;
        }
    }
    
    return -1;
}

#endif
