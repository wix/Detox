//
//  TCChatCell.h
//  SocketRocket
//
//  Created by Mike Lewis on 1/28/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface TCChatCell : UITableViewCell

@property (nonatomic, retain) IBOutlet UITextView *textView;
@property (nonatomic, retain) IBOutlet UILabel *nameLabel;

@end
