//
//  DragDropTableViewController.m
//  example
//
//  Created by Leo Natan on 1/31/21.
//  Copyright © 2021 Wix. All rights reserved.
//

#import "DragDropTableViewController.h"

@interface DragDropTableViewController ()
{
	NSMutableArray* _items;
}

@end

@implementation DragDropTableViewController

- (instancetype)initWithStyle:(UITableViewStyle)style
{
	self = [super initWithStyle:style];
	
	if(self)
	{
		self.modalPresentationStyle = UIModalPresentationFullScreen;
	}
	
	return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    
	_items = [NSMutableArray new];
	for(NSUInteger idx = 0; idx < 15; idx++)
	{
		[_items addObject:[@(idx + 1) stringValue]];
	}
	
	[self.tableView registerClass:UITableViewCell.class forCellReuseIdentifier:@"cell"];
	
	self.editing = YES;
	
	UIButton* closeButton = [UIButton buttonWithType:UIButtonTypeSystem];
	[closeButton setImage:[UIImage systemImageNamed:@"xmark.circle.fill"] forState:UIControlStateNormal];
	closeButton.translatesAutoresizingMaskIntoConstraints = NO;
	closeButton.accessibilityIdentifier = @"closeButton";
	[closeButton addTarget:self action:@selector(_close) forControlEvents:UIControlEventPrimaryActionTriggered];
	
	[self.view addSubview:closeButton];
	
	[NSLayoutConstraint activateConstraints:@[
		[self.view.layoutMarginsGuide.trailingAnchor constraintEqualToAnchor:closeButton.trailingAnchor],
		[self.view.layoutMarginsGuide.topAnchor constraintEqualToAnchor:closeButton.topAnchor],
	]];
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return _items.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"cell" forIndexPath:indexPath];
    
	cell.accessibilityIdentifier = [NSString stringWithFormat:@"cell%@", @(indexPath.row + 1)];
	cell.textLabel.text = _items[indexPath.row];
	cell.textLabel.accessibilityIdentifier = @"cellTextLabel";
    
    return cell;
}

- (BOOL)tableView:(UITableView *)tableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath
{
	return YES;
}

- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)sourceIndexPath toIndexPath:(NSIndexPath *)destinationIndexPath
{
	[_items exchangeObjectAtIndex:sourceIndexPath.row withObjectAtIndex:destinationIndexPath.row];
}

- (void)_close
{
	[self.presentingViewController dismissViewControllerAnimated:YES completion:nil];
}

@end
