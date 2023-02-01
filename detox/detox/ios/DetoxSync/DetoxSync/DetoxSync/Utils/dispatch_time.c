//
//  dispatch_time.c
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/12/20.
//  Copyright © 2020 wix. All rights reserved.
//

#include "dispatch_time.h"
#include <mach/mach_time.h>

static inline uint64_t
_dispatch_get_nanoseconds(void)
{
	return clock_gettime_nsec_np(CLOCK_REALTIME);
}

typedef enum {
	DISPATCH_CLOCK_UPTIME,
	DISPATCH_CLOCK_MONOTONIC,
	DISPATCH_CLOCK_WALL,
#define DISPATCH_CLOCK_COUNT  (DISPATCH_CLOCK_WALL + 1)
} dispatch_clock_t;

#define DISPATCH_UP_OR_MONOTONIC_TIME_MASK	(1ULL << 63)
#define DISPATCH_WALLTIME_MASK	(1ULL << 62)
#define DISPATCH_TIME_MAX_VALUE (DISPATCH_WALLTIME_MASK - 1)

DISPATCH_ALWAYS_INLINE
static inline void
_dispatch_time_to_clock_and_value(dispatch_time_t time,
								  dispatch_clock_t *clock, uint64_t *value)
{
	uint64_t actual_value;
	if ((int64_t)time < 0) {
		// Wall time or mach continuous time
		if (time & DISPATCH_WALLTIME_MASK) {
			// Wall time (value 11 in bits 63, 62)
			*clock = DISPATCH_CLOCK_WALL;
			actual_value = time == DISPATCH_WALLTIME_NOW ?
			_dispatch_get_nanoseconds() : (uint64_t)-time;
		} else {
			// Continuous time (value 10 in bits 63, 62).
			*clock = DISPATCH_CLOCK_MONOTONIC;
			actual_value = time & ~DISPATCH_UP_OR_MONOTONIC_TIME_MASK;
		}
	} else {
		*clock = DISPATCH_CLOCK_UPTIME;
		actual_value = time;
	}
	
	// Range-check the value before returning.
	*value = actual_value > DISPATCH_TIME_MAX_VALUE ? DISPATCH_TIME_FOREVER
	: actual_value;
}

static inline uint64_t
_dispatch_uptime(void)
{
	return mach_absolute_time();
}

static inline uint64_t
_dispatch_monotonic_time(void)
{
	return mach_continuous_time();
}

#if defined(__i386__) || defined(__x86_64__)
#define DISPATCH_TIME_UNIT_USES_NANOSECONDS 1
#else
#define DISPATCH_TIME_UNIT_USES_NANOSECONDS 0
#endif

#if DISPATCH_TIME_UNIT_USES_NANOSECONDS
// x86 currently implements mach time in nanoseconds
// this is NOT likely to change
DISPATCH_ALWAYS_INLINE
static inline uint64_t
_dispatch_time_mach2nano(uint64_t machtime)
{
	return machtime;
}
#else
typedef struct _dispatch_host_time_data_s {
	long double frac;
	bool ratio_1_to_1;
} _dispatch_host_time_data_s;

static _dispatch_host_time_data_s _dispatch_host_time_data;

static void
_dispatch_host_time_init(mach_timebase_info_data_t *tbi)
{
	_dispatch_host_time_data.frac = tbi->numer;
	_dispatch_host_time_data.frac /= tbi->denom;
	_dispatch_host_time_data.ratio_1_to_1 = (tbi->numer == tbi->denom);
}

__attribute__((constructor))
static void
_dispatch_time_init(void)
{
	mach_timebase_info_data_t tbi;
	mach_timebase_info(&tbi);
	_dispatch_host_time_init(&tbi);
}

static uint64_t
_dispatch_mach_host_time_mach2nano(uint64_t machtime)
{
	_dispatch_host_time_data_s *const data = &_dispatch_host_time_data;
	if (unlikely(!machtime || data->ratio_1_to_1)) {
		return machtime;
	}
	if (machtime >= INT64_MAX) {
		return INT64_MAX;
	}
	long double big_tmp = ((long double)machtime * data->frac) + .5L;
	if (unlikely(big_tmp >= INT64_MAX)) {
		return INT64_MAX;
	}
	return (uint64_t)big_tmp;
}

static inline uint64_t
_dispatch_time_mach2nano(uint64_t machtime)
{
	return _dispatch_mach_host_time_mach2nano(machtime);
}
#endif

uint64_t
_dispatch_timeout(dispatch_time_t when)
{
	dispatch_time_t now;
	if (when == DISPATCH_TIME_FOREVER) {
		return DISPATCH_TIME_FOREVER;
	}
	if (when == DISPATCH_TIME_NOW) {
		return 0;
	}
	
	dispatch_clock_t clock;
	uint64_t value;
	_dispatch_time_to_clock_and_value(when, &clock, &value);
	if (clock == DISPATCH_CLOCK_WALL) {
		now = _dispatch_get_nanoseconds();
		return now >= value ? 0 : value - now;
	} else {
		if (clock == DISPATCH_CLOCK_UPTIME) {
			now = _dispatch_uptime();
		} else {
			now = _dispatch_monotonic_time();
		}
		return now >= value ? 0 : _dispatch_time_mach2nano(value - now);
	}
}

uint64_t
_dispatch_time_nanoseconds_since_epoch(dispatch_time_t when)
{
	if (when == DISPATCH_TIME_FOREVER) {
		return DISPATCH_TIME_FOREVER;
	}
	if ((int64_t)when < 0) {
		// time in nanoseconds since the POSIX epoch already
		return (uint64_t)-(int64_t)when;
	}
	
	// Up time or monotonic time.
	return _dispatch_get_nanoseconds() + _dispatch_timeout(when);
}
