#import "CalendarManager.h"
#import <EventKit/EventKit.h>

@implementation CalendarManager
RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(getAuthorizationStatus:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    EKAuthorizationStatus status = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
    NSString* permission;
    if (status == EKAuthorizationStatusAuthorized)
	{
        permission = @"granted";
	}
    else
	{
        permission = @"denied";
	}

    resolve(permission);
}

@end
