//
//  COSDetailViewController.m
//  TouchVisualizer
//
//  Created by Joe Blau on 3/22/14.
//  Copyright (c) 2014 conopsys. All rights reserved.
//

#import "COSDetailViewController.h"

@interface COSDetailViewController ()
@property (weak, nonatomic) IBOutlet UILabel *holding;
- (void)configureView;
@end

@implementation COSDetailViewController

#pragma mark - Managing the detail item

- (void)setDetailItem:(id)newDetailItem {
    if (_detailItem != newDetailItem) {
        _detailItem = newDetailItem;
        [self configureView]; // Update the view
    }
}

- (IBAction)toggleStatusBar:(UIButton *)sender {
    [[UIApplication sharedApplication] setStatusBarHidden:![UIApplication sharedApplication].statusBarHidden withAnimation:UIStatusBarAnimationSlide];
}

- (IBAction)startHoldAction:(UIButton *)sender {
    self.holding.text = @"Pressed";
    self.holding.textColor = [UIColor blackColor];
}

- (IBAction)releaseHoldAction:(UIButton *)sender {
    self.holding.text = @"Not Pressed";
    self.holding.textColor = [UIColor lightGrayColor];
}

- (void)configureView {
    // Update the user interface for the detail item.
    if (self.detailItem)
        self.detailDescriptionLabel.text = [self.detailItem description];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    [self configureView];
}

@end
