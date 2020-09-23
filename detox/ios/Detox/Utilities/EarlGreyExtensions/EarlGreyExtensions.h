//
//  EarlGreyExtensions.h
//  Detox
//
//  Created by Leo Natan (Wix) on 12/10/2016.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <EarlGrey/EarlGrey.h>
#import <EarlGrey+Detox.h>

/**
 Expose provate Earl Grey methods
 */
@interface GREYUIThreadExecutor ()

- (void)registerIdlingResource:(id<GREYIdlingResource>)resource;
- (void)deregisterIdlingResource:(id<GREYIdlingResource>)resource;
- (NSOrderedSet *)grey_busyResources;
- (NSDictionary *)grey_errorDictionaryForBusyResources:(NSOrderedSet *)busyResources;

@end
