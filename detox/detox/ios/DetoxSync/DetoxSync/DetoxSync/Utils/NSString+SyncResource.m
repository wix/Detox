//
//  NSString+SyncResource.m
//  DetoxSync
//
//  Created by Asaf Korem on 31/10/2021.
//  Copyright © 2021 wix. All rights reserved.
//

#import "NSString+SyncResource.h"

@implementation NSString (SyncResource)

+ (NSString *)dtx_resourceNameKey {
  return @"name";
}

+ (NSString *)dtx_resourceDescriptionKey {
  return @"description";
}

@end
