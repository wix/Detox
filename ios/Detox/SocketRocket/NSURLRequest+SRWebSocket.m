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

#import "NSURLRequest+SRWebSocket.h"

NS_ASSUME_NONNULL_BEGIN

@implementation NSURLRequest (SRWebSocket)

- (nullable NSArray *)SR_SSLPinnedCertificates
{
    return [NSURLProtocol propertyForKey:@"SR_SSLPinnedCertificates" inRequest:self];
}

@end

@implementation NSMutableURLRequest (SRWebSocket)

- (nullable NSArray *)SR_SSLPinnedCertificates
{
    return [NSURLProtocol propertyForKey:@"SR_SSLPinnedCertificates" inRequest:self];
}

- (void)setSR_SSLPinnedCertificates:(nullable NSArray *)SR_SSLPinnedCertificates
{
    [NSURLProtocol setProperty:SR_SSLPinnedCertificates forKey:@"SR_SSLPinnedCertificates" inRequest:self];
}

@end

NS_ASSUME_NONNULL_END
