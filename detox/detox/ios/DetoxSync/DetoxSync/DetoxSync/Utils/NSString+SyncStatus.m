//
//  NSString+SyncStatus.m
//  DetoxSync
//
//  Created by asaf korem on 02/11/2021.
//  Copyright © 2021 wix. All rights reserved.
//

#import "NSString+SyncStatus.h"

@implementation NSString (SyncStatus)

+ (NSString *)dtx_appStatusKey {
  return @"app_status";
}

+ (NSString *)dtx_busyResourcesKey {
  return @"busy_resources";
}

@end
