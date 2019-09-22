//
//  EarlGrey+GREYConfiguration_Detox.m
//  Detox
//
//  Created by Rotem Mizrachi Meidan on 18/06/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import "GREYConfiguration+Detox.h"

@implementation GREYConfiguration(Detox)


- (void)enableSynchronization
{
	[self setValue:@(YES) forConfigKey:kGREYConfigKeySynchronizationEnabled];
}

- (void)disableSynchronization
{
	[self setValue:@(NO) forConfigKey:kGREYConfigKeySynchronizationEnabled];
}

@end
