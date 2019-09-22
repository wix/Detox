//
//  COSAppDelegate.m
//  TouchVisualizer
//
//  Created by Joe Blau on 3/22/14.
//  Copyright (c) 2014 conopsys. All rights reserved.
//

#import "COSAppDelegate.h"
#import <COSTouchVisualizerWindow.h>

@interface COSAppDelegate () <COSTouchVisualizerWindowDelegate>
@end

@implementation COSAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // Override point for customization after application launch.
    return YES;
}

- (COSTouchVisualizerWindow *)window {
    static COSTouchVisualizerWindow *customWindow = nil;
    if (!customWindow) {
        customWindow = [[COSTouchVisualizerWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
        
        [customWindow setFillColor:[UIColor purpleColor]];
        [customWindow setStrokeColor:[UIColor blueColor]];
        [customWindow setTouchAlpha:0.4];

        [customWindow setRippleFillColor:[UIColor purpleColor]];
        [customWindow setRippleStrokeColor:[UIColor blueColor]];
        [customWindow setRippleAlpha:0.1];
        
        [customWindow setTouchVisualizerWindowDelegate:self];
    }
    return customWindow;
}

#pragma mark - COSTouchVisualizerWindowDelegate

- (BOOL)touchVisualizerWindowShouldAlwaysShowFingertip:(COSTouchVisualizerWindow *)window {
    return YES;
}

@end
