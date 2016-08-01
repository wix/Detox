//
//  DetoxLoader.h
//  Detox
//
//  Created by Tal Kol on 7/27/16.
//  Copyright © 2016 Wix. All rights reserved.
//

#ifndef DetoxLoader_h
#define DetoxLoader_h


#import <Foundation/Foundation.h>
#import "DetoxManager.h"
#import <dlfcn.h>

static inline void detoxConditionalInit()
{
    NSUserDefaults* options = [NSUserDefaults standardUserDefaults];
    
    // options (standardUserDefaults) include command line arguments:
    // MyApplication -detoxServer "http://localhost:8099" -detoxSessionId "example"
    
    NSString *detoxServer = [options stringForKey:@"detoxServer"];
    NSString *detoxSessionId = [options stringForKey:@"detoxSessionId"];
    if (!detoxServer || !detoxSessionId)
    {
        // if these args were not provided as part of options, don't start Detox at all!
        return;
    }
    
    Class DetoxManager = NSClassFromString(@"DetoxManager");
    if (DetoxManager == nil)
    {
        NSString* resourcePath = [[NSBundle mainBundle] resourcePath];
        NSString* dlPath = [NSString stringWithFormat: @"%@/Frameworks/Detox.framework/Detox", resourcePath];
        const char* cdlpath = [dlPath UTF8String];
        void *handle = dlopen(cdlpath, RTLD_NOW);
        if (handle)
        {
            DetoxManager = NSClassFromString(@"DetoxManager");
            dlclose(handle);
        }
    }
    else 
    {
        NSLog(@"[%s] main: Unable to open library: %s\n", __FILE__, dlerror());
    }
    if (DetoxManager != nil)
    {
        [[DetoxManager sharedInstance] connectToServer:detoxServer withSessionId:detoxSessionId];
    }
    else
    {
        NSLog(@"ERROR: Detox could not be loaded, make sure after build that Detox.framework is found in the /Frameworks folder of the app");
    }
}


#endif /* DetoxLoader_h */
