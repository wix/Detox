//
//  CustomKeyboardViewController.m
//  example
//
//  Created by Tyrone Trevorrow on 26/4/21.
//  Copyright © 2021 Wix. All rights reserved.
//

#import "CustomKeyboardViewController.h"

@class CustomKeyboardView;
@protocol CustomKeyboardDelegate
- (void) customKeyboardTappedButton: (CustomKeyboardView*) sender;
@end

@interface CustomKeyboardView : UIView
@property (nonatomic, weak) id<CustomKeyboardDelegate> delegate;
- (void) loadView;
@end

@implementation CustomKeyboardView

- (void) loadView
{
	UIButton* kbButton = [UIButton buttonWithType: UIButtonTypeCustom];
	kbButton.translatesAutoresizingMaskIntoConstraints = NO;
	[kbButton setTitle: @"Hello" forState: UIControlStateNormal];
	[kbButton addTarget: self action: @selector(buttonTapped:) forControlEvents: UIControlEventTouchUpInside];
	kbButton.accessibilityIdentifier = @"keyboardHelloButton";
	
	[self addSubview: kbButton];
	
	[NSLayoutConstraint activateConstraints: @[
		[kbButton.widthAnchor constraintGreaterThanOrEqualToConstant:44],
		[kbButton.heightAnchor constraintEqualToConstant:44],
		[kbButton.leadingAnchor constraintEqualToAnchor:self.leadingAnchor constant:20],
		[kbButton.topAnchor constraintEqualToAnchor:self.topAnchor constant:20]
	]];
}

- (void) buttonTapped: (id) sender
{
	if (self.delegate) {
		[self.delegate customKeyboardTappedButton: self];
	}
}

@end

@interface CustomKeyboardViewController () <CustomKeyboardDelegate>
@property (nonatomic, strong) UITextField* textField;
@end

@implementation CustomKeyboardViewController

- (void)viewDidLoad
{
	[super viewDidLoad];
	
	self.view.backgroundColor = UIColor.systemBackgroundColor;
	
	UIButton* closeButton = [UIButton buttonWithType:UIButtonTypeSystem];
	[closeButton setImage:[UIImage systemImageNamed:@"xmark.circle.fill"] forState:UIControlStateNormal];
	closeButton.translatesAutoresizingMaskIntoConstraints = NO;
	closeButton.accessibilityIdentifier = @"closeButton";
	[closeButton addTarget:self action:@selector(_close) forControlEvents:UIControlEventPrimaryActionTriggered];
	
	CustomKeyboardView* inputView = [[CustomKeyboardView alloc] init];
	inputView.translatesAutoresizingMaskIntoConstraints = NO;
	inputView.delegate = self;
	[inputView setBackgroundColor: [UIColor lightGrayColor]];
	[inputView loadView];
	
	UITextField* text = [[UITextField alloc] init];
	text.translatesAutoresizingMaskIntoConstraints = NO;
	text.inputView = inputView;
	text.borderStyle = UITextBorderStyleRoundedRect;
	text.accessibilityIdentifier = @"textWithCustomInput";
	
	UILabel* obscuredLabel = [[UILabel alloc] init];
	obscuredLabel.translatesAutoresizingMaskIntoConstraints = NO;
	obscuredLabel.text = @"Obscured by keyboard";
	
	self.textField = text;
	
	[self.view addSubview:closeButton];
	[self.view addSubview:text];
	[self.view addSubview:obscuredLabel];
	
	[NSLayoutConstraint activateConstraints:@[
		[text.heightAnchor constraintEqualToConstant:50],
		[text.leadingAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.leadingAnchor constant:20],
		[self.view.safeAreaLayoutGuide.trailingAnchor constraintEqualToAnchor:text.trailingAnchor constant:20],
		[text.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor constant:50],
		
		[inputView.widthAnchor constraintEqualToConstant:self.view.frame.size.width],
		
		[self.view.layoutMarginsGuide.trailingAnchor constraintEqualToAnchor:closeButton.trailingAnchor],
		[self.view.layoutMarginsGuide.topAnchor constraintEqualToAnchor:closeButton.topAnchor],
		
		[obscuredLabel.leadingAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.leadingAnchor constant:20],
		[self.view.safeAreaLayoutGuide.trailingAnchor constraintGreaterThanOrEqualToAnchor:obscuredLabel.trailingAnchor constant:20],
		[self.view.safeAreaLayoutGuide.bottomAnchor constraintEqualToAnchor:obscuredLabel.bottomAnchor constant:50],
	]];
}

- (void)customKeyboardTappedButton:(CustomKeyboardView *)sender
{
	[self.textField setText:@"World!"];
}

- (void)_close
{
	[self.presentingViewController dismissViewControllerAnimated:YES completion:nil];
}

@end
