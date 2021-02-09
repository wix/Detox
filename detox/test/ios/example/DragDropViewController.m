//
//  DragDropViewController.m
//  example
//
//  Created by Leo Natan on 1/31/21.
//  Copyright © 2021 Wix. All rights reserved.
//

#import "DragDropViewController.h"

@interface DragDropViewController () <UIDragInteractionDelegate, UIDropInteractionDelegate>
{
	UILabel* _statusLabel;
}

@end

@implementation DragDropViewController

- (instancetype)init
{
	self = [super init];
	
	if(self)
	{
		self.modalPresentationStyle = UIModalPresentationFullScreen;
	}
	
	return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    
	self.view.backgroundColor = UIColor.systemBackgroundColor;
	
	UIButton* closeButton = [UIButton buttonWithType:UIButtonTypeSystem];
	[closeButton setImage:[UIImage systemImageNamed:@"xmark.circle.fill"] forState:UIControlStateNormal];
	closeButton.translatesAutoresizingMaskIntoConstraints = NO;
	closeButton.accessibilityIdentifier = @"closeButton";
	[closeButton addTarget:self action:@selector(_close) forControlEvents:UIControlEventPrimaryActionTriggered];
	
	UIImageView* icon1 = [UIImageView new];
	icon1.tag = 1;
	icon1.image = [UIImage systemImageNamed:@"hand.tap.fill"];
	icon1.translatesAutoresizingMaskIntoConstraints = NO;
	icon1.contentMode = UIViewContentModeScaleAspectFit;
	icon1.layer.borderColor = UIColor.redColor.CGColor;
	icon1.layer.borderWidth = 2;
	icon1.accessibilityIdentifier = @"dragIcon1";
	
	UIImageView* icon2 = [UIImageView new];
	icon2.tag = 2;
	icon2.image = [UIImage systemImageNamed:@"hands.clap.fill"];
	icon2.translatesAutoresizingMaskIntoConstraints = NO;
	icon2.contentMode = UIViewContentModeScaleAspectFit;
	icon2.layer.borderColor = UIColor.redColor.CGColor;
	icon2.layer.borderWidth = 2;
	icon2.accessibilityIdentifier = @"dragIcon2";
	
	UIView* iconContainer = [UIView new];
	iconContainer.translatesAutoresizingMaskIntoConstraints = NO;
	
	UIView* dropContainer = [UIView new];
	dropContainer.translatesAutoresizingMaskIntoConstraints = NO;
	dropContainer.layer.borderColor = UIColor.grayColor.CGColor;
	dropContainer.layer.borderWidth = 10;
	dropContainer.accessibilityIdentifier = @"dropContainer";
	
	_statusLabel = [UILabel new];
	_statusLabel.translatesAutoresizingMaskIntoConstraints = NO;
	_statusLabel.text = nil;
	
	[self.view addSubview:iconContainer];
	[self.view addSubview:dropContainer];
	[self.view addSubview:_statusLabel];
	[iconContainer addSubview:icon1];
	[iconContainer addSubview:icon2];
	
	[self.view addSubview:closeButton];
	
	[NSLayoutConstraint activateConstraints:@[
		[icon1.widthAnchor constraintEqualToAnchor:icon2.widthAnchor],
		[icon1.heightAnchor constraintEqualToAnchor:icon2.heightAnchor],
		
		[icon1.widthAnchor constraintEqualToConstant:50],
		[icon1.heightAnchor constraintEqualToConstant:50],
		
		[icon1.topAnchor constraintEqualToAnchor:iconContainer.topAnchor constant:50],
		[icon1.leadingAnchor constraintEqualToAnchor:iconContainer.leadingAnchor constant:50],
		
		[icon2.topAnchor constraintEqualToAnchor:iconContainer.topAnchor constant:50],
		[icon2.trailingAnchor constraintEqualToAnchor:iconContainer.trailingAnchor constant:-50],
		
		[iconContainer.heightAnchor constraintEqualToAnchor:dropContainer.heightAnchor],
		
		[self.view.safeAreaLayoutGuide.leadingAnchor constraintEqualToAnchor:iconContainer.leadingAnchor],
		[self.view.safeAreaLayoutGuide.trailingAnchor constraintEqualToAnchor:iconContainer.trailingAnchor],
		[self.view.safeAreaLayoutGuide.topAnchor constraintEqualToAnchor:iconContainer.topAnchor],
		[dropContainer.topAnchor constraintEqualToAnchor:iconContainer.bottomAnchor],
		[self.view.safeAreaLayoutGuide.leadingAnchor constraintEqualToAnchor:dropContainer.leadingAnchor],
		[self.view.safeAreaLayoutGuide.trailingAnchor constraintEqualToAnchor:dropContainer.trailingAnchor],
		[self.view.safeAreaLayoutGuide.bottomAnchor constraintEqualToAnchor:dropContainer.bottomAnchor],
		
		[dropContainer.topAnchor constraintEqualToAnchor:_statusLabel.bottomAnchor constant:10],
		[self.view.safeAreaLayoutGuide.centerXAnchor constraintEqualToAnchor:_statusLabel.centerXAnchor],
		
		[self.view.layoutMarginsGuide.trailingAnchor constraintEqualToAnchor:closeButton.trailingAnchor],
		[self.view.layoutMarginsGuide.topAnchor constraintEqualToAnchor:closeButton.topAnchor],
	]];
	
	icon1.userInteractionEnabled = YES;
	UIDragInteraction* dragInteraction1 = [[UIDragInteraction alloc] initWithDelegate:self];
	dragInteraction1.enabled = YES;
	[icon1 addInteraction:dragInteraction1];
	
	icon2.userInteractionEnabled = YES;
	UIDragInteraction* dragInteraction2 = [[UIDragInteraction alloc] initWithDelegate:self];
	dragInteraction2.enabled = YES;
	[icon2 addInteraction:dragInteraction2];
	
	UIDropInteraction* dropInteraction = [[UIDropInteraction alloc] initWithDelegate:self];
	[dropContainer addInteraction:dropInteraction];
}

- (NSArray<UIDragItem *> *)dragInteraction:(UIDragInteraction *)interaction itemsForBeginningSession:(id<UIDragSession>)session
{
	NSItemProvider* provider = [[NSItemProvider alloc] initWithObject:[NSString stringWithFormat:@"Drag %@", @(interaction.view.tag)]];
	
	return @[
		[[UIDragItem alloc] initWithItemProvider:provider],
	];
}

- (BOOL)dropInteraction:(UIDropInteraction *)interaction canHandleSession:(id<UIDropSession>)session
{
	return YES;
}

- (UIDropProposal *)dropInteraction:(UIDropInteraction *)interaction sessionDidUpdate:(id<UIDropSession>)session
{
	return [[UIDropProposal alloc] initWithDropOperation:UIDropOperationCopy];
}

- (void)dropInteraction:(UIDropInteraction *)interaction performDrop:(id<UIDropSession>)session
{
	[session loadObjectsOfClass:NSString.class completion:^(NSArray<__kindof id<NSItemProviderReading>> * _Nonnull objects) {
		_statusLabel.text = objects.firstObject;
	}];
}

- (void)_close
{
	[self.presentingViewController dismissViewControllerAnimated:YES completion:nil];
}

@end
