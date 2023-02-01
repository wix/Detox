//
//  dispatch_time.h
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/12/20.
//  Copyright © 2020 wix. All rights reserved.
//

#include <dispatch/time.h>

#define unlikely dtx_unlikely

#ifndef dispatch_time_h
#define dispatch_time_h

uint64_t
_dispatch_time_nanoseconds_since_epoch(dispatch_time_t when);

#endif /* dispatch_time_h */
