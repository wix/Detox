//
//  NSURLSessionTask+DTXSpy.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/4/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSURLSessionTask (DTXSpy)

- (void)__detox_sync_untrackTask;

@end

NS_ASSUME_NONNULL_END
