//
//  MasterViewController.h
//  iOS7Example
//
//  Created by Erik Doernenburg on 10/06/2014.
//  Copyright (c) 2014 Erik Doernenburg. All rights reserved.
//

#import <UIKit/UIKit.h>

@class DetailViewController;

@interface MasterViewController : UITableViewController

@property (strong, nonatomic) DetailViewController *detailViewController;

@end
