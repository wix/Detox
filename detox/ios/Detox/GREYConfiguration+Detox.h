//
//  GREYConfiguration+Detox.h
//  Detox
//
//  Created by Rotem Mizrachi Meidan on 18/06/2017.
//  Copyright © 2017 Wix. All rights reserved.
//

#import <EarlGrey/GREYConfiguration.h>

@interface GREYConfiguration (Detox)

- (void)enableSynchronization;

- (void)disableSynchronization;

@end


