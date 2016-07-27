//
// Copyright (c) 2016-present, Facebook, Inc.
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree. An additional grant
// of patent rights can be found in the PATENTS file in the same directory.
//

#import "SRSecurityOptions.h"

#import "SRURLUtilities.h"

NS_ASSUME_NONNULL_BEGIN

@implementation SRSecurityOptions

///--------------------------------------
#pragma mark - Init
///--------------------------------------

- (instancetype)initWithRequest:(NSURLRequest *)request
             pinnedCertificates:(nullable NSArray *)pinnedCertificates
         chainValidationEnabled:(BOOL)chainValidationEnabled
{
    self = [super init];
    if (!self) return self;

    _request = request;
    _requestRequiresSSL = SRURLRequiresSSL(request.URL);
    _pinnedCertificates = pinnedCertificates;
    _validatesCertificateChain = chainValidationEnabled;

    return self;
}

///--------------------------------------
#pragma mark - Stream
///---------------------------------------

- (void)updateSecurityOptionsInStream:(NSStream *)stream
{
    // SSL not required, skip everything
    if (!self.requestRequiresSSL) {
        return;
    }

    // Enable highest level of security (`.LevelNegotiatedSSL`) for the stream.
    [stream setProperty:NSStreamSocketSecurityLevelNegotiatedSSL forKey:NSStreamSocketSecurityLevelKey];

    // If we are not using pinned certs and if chain validation is enabled - enable it on a stream.
    BOOL chainValidationEnabled = (_pinnedCertificates.count == 0 && self.validatesCertificateChain);
    NSDictionary<NSString *, id> *sslOptions = @{ (__bridge NSString *)kCFStreamSSLValidatesCertificateChain : @(chainValidationEnabled) };
    [stream setProperty:sslOptions forKey:(__bridge NSString *)kCFStreamPropertySSLSettings];
}

///--------------------------------------
#pragma mark - Pinned Certificates
///--------------------------------------

- (BOOL)securityTrustContainsPinnedCertificates:(SecTrustRef)trust
{
    NSUInteger requiredCertCount = self.pinnedCertificates.count;
    if (requiredCertCount == 0) {
        return YES;
    }

    NSUInteger validatedCertCount = 0;
    CFIndex serverCertCount = SecTrustGetCertificateCount(trust);
    for (CFIndex i = 0; i < serverCertCount; i++) {
        SecCertificateRef cert = SecTrustGetCertificateAtIndex(trust, i);
        NSData *data = CFBridgingRelease(SecCertificateCopyData(cert));
        for (id ref in self.pinnedCertificates) {
            SecCertificateRef trustedCert = (__bridge SecCertificateRef)ref;
            // TODO: (nlutsenko) Add caching, so we don't copy the data for every pinned cert all the time.
            NSData *trustedCertData = CFBridgingRelease(SecCertificateCopyData(trustedCert));
            if ([trustedCertData isEqualToData:data]) {
                validatedCertCount++;
                break;
            }
        }
    }
    return (requiredCertCount == validatedCertCount);
}

@end

NS_ASSUME_NONNULL_END
