//
//  NSInvocation+Utils.h
//  DetoxTester
//
//  Created by Asaf Korem (Wix.com).
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Utils for \c NSInvocation class.
@interface NSInvocation (Utils)

/// Creates a new invocation instance from given \c selector on given \c target.
+ (NSInvocation *)createFromSelector:(SEL)selector target:(id)target;

@end

NS_ASSUME_NONNULL_END
