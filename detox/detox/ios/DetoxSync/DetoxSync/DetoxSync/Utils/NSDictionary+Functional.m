//
//  NSDictionary+Functional.m
//  DetoxSync
//
//  Created by asaf korem on 22/11/2021.
//  Copyright © 2021 wix. All rights reserved.
//

#import "NSDictionary+Functional.h"

@implementation NSDictionary (Functional)

- (NSDictionary *)filter:(FilterBlockWithKeyValue)block {
  NSDictionary *dictionary = [self copy];
  NSMutableDictionary *filterredDictionary = [NSMutableDictionary new];

  for (id key in dictionary) {
    id value = dictionary[key];
    if (block(key, value)) {
      filterredDictionary[key] = value;
    }
  }

  return filterredDictionary;
}

- (NSDictionary *)map:(MapBlockWithKeyValue)block {
  NSDictionary *dictionary = [self copy];
  NSMutableDictionary *mappedDictionary = [NSMutableDictionary new];

  for (id key in dictionary) {
    id value = dictionary[key];
    mappedDictionary[key] = block(key, value);
  }

  return mappedDictionary;
}

@end
