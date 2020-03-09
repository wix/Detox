//
//  __DTXDeallocSafeProxy.h
//  Detox
//
//  Created by Leo Natan (Wix) on 3/9/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface __DTXDeallocSafeProxy : NSObject

@property (nonatomic, weak, readonly) id object;

- (instancetype)initWithObject:(id)object;

@property (readonly, copy) NSURLRequest  *originalRequest;

@end
