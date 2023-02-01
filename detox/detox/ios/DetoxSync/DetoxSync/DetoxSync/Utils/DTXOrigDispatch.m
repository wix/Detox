//
//  DTXOrigDispatch.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/31/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "DTXOrigDispatch.h"

void (*__detox_sync_orig_dispatch_sync)(dispatch_queue_t queue, dispatch_block_t block);
void (*__detox_sync_orig_dispatch_async)(dispatch_queue_t queue, dispatch_block_t block);
void (*__detox_sync_orig_dispatch_after)(dispatch_time_t when, dispatch_queue_t queue, dispatch_block_t block);
