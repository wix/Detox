//
//  NSURL+DetoxSyncUtils.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 7/14/20.
//  Copyright © 2020 wix. All rights reserved.
//

#import "NSURL+DetoxSyncUtils.h"
#import <DetoxSync/DTXSyncManager.h>

@implementation NSURL (DetoxSyncUtils)

- (BOOL)detox_sync_shouldTrack
{
	if([self.scheme isEqualToString:@"data"])
	{
		return NO;
	}
	
	NSArray<NSString*>* blacklist = DTXSyncManager.URLBlacklist;
	if(dtx_likely(blacklist.count == 0))
	{
		return YES;
	}
	
	NSString* abs = self.absoluteString;
	
	//Fast path of equality
	if([blacklist containsObject:abs])
	{
		return NO;
	}
	
	NSError* err;
	for (NSString* regexStr in blacklist)
	{
		NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:regexStr options:0 error:&err];
		NSAssert(regex != nil, @"Invalid regular expression provided: %@", err.localizedDescription);
		NSRange match = [regex rangeOfFirstMatchInString:abs options:0 range:NSMakeRange(0, abs.length)];
		if(match.location != NSNotFound)
		{
			return NO;
		}
	}
	
	return YES;
}

@end
