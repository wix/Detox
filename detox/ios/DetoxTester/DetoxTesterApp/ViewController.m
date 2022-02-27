//
//  ViewController.m
//  Tester
//
//  Created by asaf korem on 06/01/2022.
//

#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  [self setup];
}

- (void)setup {
  UILabel *welcomeLabel = [[UILabel alloc] initWithFrame:self.view.frame];
  [welcomeLabel setText:@"Welcome to Tester's App"];
  [welcomeLabel setFont:[UIFont systemFontOfSize:24 weight:UIFontWeightBold]];
  [welcomeLabel setTextAlignment:NSTextAlignmentCenter];
  [self.view addSubview:welcomeLabel];

  [NSLayoutConstraint activateConstraints:@[
    [welcomeLabel.centerXAnchor constraintEqualToAnchor:self.view.centerXAnchor],
    [welcomeLabel.centerYAnchor constraintEqualToAnchor:self.view.centerYAnchor]
  ]];
}

@end
