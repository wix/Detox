//
//  AppDelegate.m
//  NativeExample
//
//  Created by Etgar Shmueli on 31/07/2016.
//  Copyright © 2016 Etgar Shmueli. All rights reserved.
//

#import "AppDelegate.h"
#import "DetoxLoader.h"

@interface AppDelegate ()

@end

@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    detoxConditionalInit();
    return YES;
}

@end
