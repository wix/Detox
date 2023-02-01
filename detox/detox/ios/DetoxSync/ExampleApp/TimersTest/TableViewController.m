//
//  TableViewController.m
//  TimersTest
//
//  Created by Leo Natan (Wix) on 7/31/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "TableViewController.h"

UIColor* LNRandomDarkColor(void)
{
	CGFloat hue = ( arc4random() % 256 / 256.0 );
	CGFloat saturation = 0.7;
	CGFloat brightness = 0.5 + ( arc4random() % 64 / 256.0 );
	return [UIColor colorWithHue:hue saturation:saturation brightness:brightness alpha:1];
}

UIColor* LNRandomLightColor(void)
{
	CGFloat hue = ( arc4random() % 256 / 256.0 );
	CGFloat saturation = 0.7;
	CGFloat brightness = 1.0 - ( arc4random() % 64 / 256.0 );
	return [UIColor colorWithHue:hue saturation:saturation brightness:brightness alpha:1];
}

UIColor* LNRandomAdaptiveColor(void)
{
	UIColor* light = LNRandomLightColor();
	UIColor* dark = LNRandomDarkColor();
	if (@available(iOS 13.0, *))
	{
		return [UIColor colorWithDynamicProvider:^UIColor * _Nonnull(UITraitCollection * _Nonnull collection) {
			if(collection.userInterfaceStyle == UIUserInterfaceStyleDark)
			{
				return dark;
			}
			else
			{
				return light;
			}
		}];
	}
	else
	{
		return dark;
	}
}

@interface TableViewController ()

@end

@implementation TableViewController

- (void)viewDidLoad
{
    [super viewDidLoad];
}

- (void)viewDidAppear:(BOOL)animated
{
	[super viewDidAppear:animated];
	
	CGPoint bottomOffset = CGPointMake(0, self.tableView.contentSize.height - self.tableView.bounds.size.height + self.tableView.contentInset.bottom);
	[self.tableView setContentOffset:bottomOffset animated:YES];
}

#pragma mark - Table view data source

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section;
{
	return 100;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath;
{
	UITableViewCell* cell = [tableView dequeueReusableCellWithIdentifier:@"Cell"];
	
	cell.contentView.backgroundColor = LNRandomAdaptiveColor();
	
	return cell;
}

@end
