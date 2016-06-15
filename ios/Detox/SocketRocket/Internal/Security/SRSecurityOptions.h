//
// Copyright (c) 2016-present, Facebook, Inc.
// All rights reserved.
//
// This source code is licensed under the BSD-style license found in the
// LICENSE file in the root directory of this source tree. An additional grant
// of patent rights can be found in the PATENTS file in the same directory.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface SRSecurityOptions: NSObject

@property (nonatomic, strong, readonly) NSURLRequest *request;

/**
 Returns `YES` if request uses SSL, otherwise - `NO`.
 */
@property (nonatomic, assign, readonly) BOOL requestRequiresSSL;

/**
 Optional array of `SecCertificateRef` SSL certificates to use for validation.
 */
@property (nullable, nonatomic, strong, readonly) NSArray *pinnedCertificates;

/**
 Set to `NO` to disable SSL certificate chain validation.
 This option is not taken into account when using pinned certificates.
 Default: YES.
 */
@property (nonatomic, assign, readonly) BOOL validatesCertificateChain;

/**
 Initializes an instance of a controller into it with a given request and returns it.

 @param request Request to initialize with.
 */
- (instancetype)initWithRequest:(NSURLRequest *)request
             pinnedCertificates:(nullable NSArray *)pinnedCertificates
         chainValidationEnabled:(BOOL)chainValidationEnabled NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

///--------------------------------------
#pragma mark - Streams
///--------------------------------------

/**
 Updates all the security options for the current configuration.

 @param stream Stream to update the options in.
 */
- (void)updateSecurityOptionsInStream:(NSStream *)stream;

///--------------------------------------
#pragma mark - Pinned Certificates
///--------------------------------------

/**
 Validates whether a given security trust contains pinned certificates.
 If no certificates are pinned - returns `YES`.

 @param trust Security trust to validate.

 @return `YES` if certificates where found, otherwise - `NO`.
 */
- (BOOL)securityTrustContainsPinnedCertificates:(SecTrustRef)trust;

@end

NS_ASSUME_NONNULL_END
