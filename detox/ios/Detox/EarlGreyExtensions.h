//
//  EarlGreyExtensions.h
//  Detox
//
//  Created by Leo Natan (Wix) on 12/10/2016.
//  Copyright © 2016 Wix. All rights reserved.
//

#import <EarlGrey/EarlGrey.h>

/**
 Expose provate Earl Grey methods
 */
@interface GREYUIThreadExecutor ()

- (void)registerIdlingResource:(id<GREYIdlingResource>)resource;
- (void)deregisterIdlingResource:(id<GREYIdlingResource>)resource;

@end

FOUNDATION_EXPORT id HC_hasProperty(NSString *propertyName, id valueMatcher);

static inline id hasProperty(NSString *propertyName, id valueMatcher)
{
	return HC_hasProperty(propertyName, valueMatcher);
}
