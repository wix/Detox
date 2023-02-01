//
//  DetailViewController.h
//  iOS9Example
//
//  Created by Erik Doernenburg on 29/09/2015.
//  Copyright © 2015 Erik Doernenburg. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface DetailViewController : UIViewController

@property (strong, nonatomic) id detailItem;
@property (weak, nonatomic) IBOutlet UILabel *detailDescriptionLabel;

@end

