//
//  NSArray+Utils.h
//  DTXObjectiveCHelpers
//
//  Created by Leo Natan (Wix) on 5/18/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NSArray<ObjectType> (Utils)

- (instancetype)dtx_mapObjectsUsingBlock:(id (^)(ObjectType obj, NSUInteger idx))block;

@end

NS_ASSUME_NONNULL_END
