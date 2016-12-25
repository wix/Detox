//
//  GreetingViewController.m
//  NativeExample
//
//  Created by Etgar Shmueli on 31/07/2016.
//  Copyright © 2016 Etgar Shmueli. All rights reserved.
//

#import "GreetingViewController.h"

@implementation GreetingViewController

-(void)viewWillAppear:(BOOL)animated {
    if (self.greeting != nil) {
        self.greetingLabel.text = self.greeting;
    }
}

@end
