//
//  MasterViewController.h
//  iOS9Example
//
//  Created by Erik Doernenburg on 29/09/2015.
//  Copyright © 2015 Erik Doernenburg. All rights reserved.
//

#import <UIKit/UIKit.h>

@class DetailViewController;

@interface MasterViewController : UITableViewController

@property (strong, nonatomic) DetailViewController *detailViewController;


@end

