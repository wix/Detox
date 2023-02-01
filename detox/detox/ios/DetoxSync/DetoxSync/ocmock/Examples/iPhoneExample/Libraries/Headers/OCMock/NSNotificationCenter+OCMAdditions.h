//---------------------------------------------------------------------------------------
//  $Id: NSNotificationCenter+OCMAdditions.h 57 2010-07-19 06:14:27Z erik $
//  Copyright (c) 2009 by Mulle Kybernetik. See License file for details.
//---------------------------------------------------------------------------------------

#import <Foundation/Foundation.h>

@class OCMockObserver;


@interface NSNotificationCenter(OCMAdditions)

- (void)addMockObserver:(OCMockObserver *)notificationObserver name:(NSString *)notificationName object:(id)notificationSender;

@end
