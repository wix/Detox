//
//  JPSimulatorHacks.m
//  JPSimulatorHacks
//
//  Created by Johannes Plunien on 04/06/14.
//  Copyright (C) 2014 Johannes Plunien
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

#import <AssetsLibrary/AssetsLibrary.h>
#import "JPSimulatorHacks.h"
#import "JPSimulatorHacksDB.h"

@implementation JPSimulatorHacks

static NSString * const JPSimulatorHacksServiceAddressBook      = @"kTCCServiceAddressBook";
static NSString * const JPSimulatorHacksServicePhotos           = @"kTCCServicePhotos";
static NSString * const JPSimulatorHacksServiceCalendar         = @"kTCCServiceCalendar";
static NSString * const JPSimulatorHacksServiceHomeKit          = @"kTCCServiceWillow";
static NSString * const JPSimulatorHacksServiceContacts         = @"kTCCServiceContacts";

static NSTimeInterval JPSimulatorHacksTimeout = 15.0f;

#pragma mark - Public

+ (void)setPhotosEnabled:(BOOL)enabled forBundleIdentifier:(NSString *)bundleIdentifier
{
	[self changeAccessToService:JPSimulatorHacksServicePhotos bundleIdentifier:bundleIdentifier allowed:enabled];
}

+ (void)setCalendarEnabled:(BOOL)enabled forBundleIdentifier:(NSString *)bundleIdentifier
{
	[self changeAccessToService:JPSimulatorHacksServiceCalendar bundleIdentifier:bundleIdentifier allowed:enabled];
}

+ (void)setHomeKitEnabled:(BOOL)enabled forBundleIdentifier:(NSString *)bundleIdentifier
{
	[self changeAccessToService:JPSimulatorHacksServiceHomeKit bundleIdentifier:bundleIdentifier allowed:enabled];
}

+ (void)setContactsEnabled:(BOOL)enabled forBundleIdentifier:(NSString *)bundleIdentifier
{
	[self changeAccessToService:JPSimulatorHacksServiceContacts bundleIdentifier:bundleIdentifier allowed:enabled];
}

+ (void)setLocationEnabled:(BOOL)enabled forBundleIdentifier:(NSString *)bundleIdentifier
{
//	[self changeAccessToService:JPSimulatorHacksServicePhotos bundleIdentifier:bundleIdentifier allowed:enabled];
}

#pragma mark - Private

+ (NSString *)cddbPath
{
    return [[self libraryURL] URLByAppendingPathComponent:@"TCC/TCC.db"].URLByStandardizingPath.path;
}

+ (NSURL *)libraryURL
{
    static NSURL *result;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSURL *url = [[NSBundle mainBundle].bundleURL URLByAppendingPathComponent:@".."];
        do {
            url = [[url URLByAppendingPathComponent:@".."] URLByStandardizingPath];
            NSURL *libraryURL = [url URLByAppendingPathComponent:@"Library"];
            BOOL isDirectory;
            if ([[NSFileManager defaultManager] fileExistsAtPath:libraryURL.path isDirectory:&isDirectory] && isDirectory) {
                url = libraryURL;
                break;
            }
        } while (![url.path isEqualToString:@"/"]);
        result = url;
    });
    return result;
}

#pragma mark - Helper

+ (BOOL)changeAccessToService:(NSString *)service
             bundleIdentifier:(NSString *)bundleIdentifier
                      allowed:(BOOL)allowed
{
#if !(TARGET_IPHONE_SIMULATOR)
    return NO;
#endif

    BOOL success = NO;
    NSDate *start = [NSDate date];

    while (!success) {
        NSTimeInterval elapsed = [[NSDate date] timeIntervalSinceDate:start];
        if (elapsed > JPSimulatorHacksTimeout) break;

        if (![[NSFileManager defaultManager] fileExistsAtPath:[self cddbPath]]) continue;

        JPSimulatorHacksDB *db = [JPSimulatorHacksDB databaseWithPath:[self cddbPath]];
        if (![db open]) continue;

        NSString *query = @"REPLACE INTO access (service, client, client_type, allowed, prompt_count) VALUES (?, ?, ?, ?, ?)";
        NSArray *parameters = @[service, bundleIdentifier, @"0", [@(allowed) stringValue], @"1"];
        if ([db executeUpdate:query withArgumentsInArray:parameters]) {
            success = YES;
        }
        else {
            [db close];
            NSLog(@"JPSimulatorHacks ERROR: %@", [db lastErrorMessage]);
        }

        [db close];
        [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.05]];
    }

    return success;
}

@end
