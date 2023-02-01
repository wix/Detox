//
//  NSArray+Utils.m
//  DTXObjectiveCHelpers
//
//  Created by Leo Natan (Wix) on 5/18/20.
//  Copyright © 2020 Wix. All rights reserved.
//

#import "NSArray+Utils.h"

DTX_DIRECT_MEMBERS
@implementation NSArray (Utils)

- (instancetype)dtx_mapObjectsUsingBlock:(id (^)(id obj, NSUInteger idx))block
{
    NSMutableArray *result = [NSMutableArray arrayWithCapacity:[self count]];
    [self enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
        [result addObject:block(obj, idx)];
    }];
    return result;
}

@end
