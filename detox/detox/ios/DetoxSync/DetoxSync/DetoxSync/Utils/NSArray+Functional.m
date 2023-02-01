//
//  NSArray+Functional.m
//  DetoxSync
//
//  Created by asaf korem on 22/11/2021.
//  Copyright © 2021 wix. All rights reserved.
//

#import "NSArray+Functional.h"

@implementation NSArray (Functional)

- (NSArray *)filter:(FilterBlock)block {
  NSArray *array = [self copy];
  NSMutableArray *filterredArray = [NSMutableArray new];

  for (id object in array) {
    if (block(object)) {
      [filterredArray addObject:object];
    }
  }

  return filterredArray;
}

- (NSArray *)map:(MapBlock)block {
  NSArray *array = [self copy];
  NSMutableArray *mappedArray = [NSMutableArray new];

  for (id object in array) {
    [mappedArray addObject:block(object)];
  }

  return mappedArray;
}

@end
