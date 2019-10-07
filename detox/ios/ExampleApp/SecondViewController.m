//
//  SecondViewController.m
//  XCUITestTest
//
//  Created by Leo Natan (Wix) on 9/12/19.
//  Copyright © 2019 LeoNatan. All rights reserved.
//

#import "SecondViewController.h"

@interface NSObject () <NSSecureCoding>

@property(readonly) const void *AXUIElement; // @synthesize AXUIElement=_AXUIElement;
@property(readonly, copy) NSData *token;
@property(readonly, copy, nonatomic) id accessibilityElement;
- (void)_accessibilityInit;

+ (id)uiElementWithAXElement:(const void *)arg1;

- (void)_accessibilityPerformSafeValueKeyBlock:(id)arg1 withKey:(id)arg2 onClass:(Class)arg3;

@end

@interface SecondViewController ()
{
	IBOutlet UITextField* _f;
	IBOutlet UILabel* _l;
}

@end

@implementation SecondViewController

- (void)viewDidLoad {
	[super viewDidLoad];
	// Do any additional setup after loading the view.
}

- (IBAction)didSet:(id)sender
{
	[self.view.window endEditing:YES];
	
	_l.text = [NSDateFormatter localizedStringFromDate:[sender date] dateStyle:NSDateFormatterLongStyle timeStyle:NSDateFormatterMediumStyle];
}

- (IBAction)didType:(id)sender
{

}

@end

@interface ZZTextField : UITextField @end
@implementation ZZTextField

- (NSString *)accessibilityIdentifier
{
	return [super accessibilityIdentifier];
}

@end

@interface ZZTabBarController : UITabBarController @end
@implementation ZZTabBarController

- (void)setSelectedViewController:(__kindof UIViewController *)selectedViewController
{
	[super setSelectedViewController:selectedViewController];
	
	NSLog(@"");
}

@end

@interface ZZDatePicker : UIDatePicker @end
@implementation ZZDatePicker

- (void)_accessibilityPerformSafeValueKeyBlock:(id)arg1 withKey:(id)arg2 onClass:(Class)arg3
{
	[super _accessibilityPerformSafeValueKeyBlock:arg1 withKey:arg2 onClass:arg3];
}

- (NSString *)accessibilityValue
{
	return [[NSKeyedArchiver archivedDataWithRootObject:self requiringSecureCoding:NO error:NULL] base64EncodedStringWithOptions:0];
}

@end
