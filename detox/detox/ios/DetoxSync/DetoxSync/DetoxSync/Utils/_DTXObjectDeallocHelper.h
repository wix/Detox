//
//  _DTXObjectDeallocHelper.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 8/6/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import <Foundation/Foundation.h>
@class DTXSyncResource;

NS_ASSUME_NONNULL_BEGIN

@interface _DTXObjectDeallocHelper : NSObject

- (instancetype)initWithSyncResource:(nullable __kindof DTXSyncResource*)syncResource;

@property (nonatomic, strong, nullable) __kindof DTXSyncResource* syncResource;

@property (nonatomic, copy, nullable) void (^performOnDealloc)(void);

@end

NS_ASSUME_NONNULL_END
