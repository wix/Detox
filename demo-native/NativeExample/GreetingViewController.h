//
//  GreetingViewController.h
//  NativeExample
//
//  Created by Etgar Shmueli on 31/07/2016.
//  Copyright © 2016 Etgar Shmueli. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface GreetingViewController : UIViewController

@property NSString *greeting;
@property (weak, nonatomic) IBOutlet UILabel *greetingLabel;

@end
