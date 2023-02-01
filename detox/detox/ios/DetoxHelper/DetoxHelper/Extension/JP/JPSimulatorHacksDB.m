//
//  JPSimulatorHacksDB.m
//  JPSimulatorHacks
//
//  Created by Johannes Plunien on 25/01/15.
//  Copyright (C) 2015 Johannes Plunien
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

#import "JPSimulatorHacksDB.h"
#if defined(JPSH_SQLITE_STANDALONE)
#import <sqlite3/sqlite3.h>
#else
#import <sqlite3.h>
#endif

@interface JPSimulatorHacksDB () {
    NSString *_databasePath;
    sqlite3 *_db;
}

@end

@implementation JPSimulatorHacksDB

+ (instancetype)databaseWithPath:(NSString *)path
{
    return [[self alloc] initWithPath:path];
}

- (instancetype)initWithPath:(NSString*)path
{
    assert(sqlite3_threadsafe());

    self = [super init];
    if (self) {
        _databasePath = path.copy;
    }

    return self;
}

- (BOOL)close
{
    if (!_db) {
        return YES;
    }

    int  rc;
    BOOL retry;
    BOOL triedFinalizingOpenStatements = NO;

    do {
        retry   = NO;
        rc      = sqlite3_close(_db);
        if (SQLITE_BUSY == rc || SQLITE_LOCKED == rc) {
            if (!triedFinalizingOpenStatements) {
                triedFinalizingOpenStatements = YES;
                sqlite3_stmt *pStmt;
                while ((pStmt = sqlite3_next_stmt(_db, nil)) !=0) {
                    NSLog(@"Closing leaked statement");
                    sqlite3_finalize(pStmt);
                    retry = YES;
                }
            }
        }
        else if (SQLITE_OK != rc) {
            NSLog(@"error closing!: %d", rc);
        }
    } while (retry);

    _db = nil;
    return YES;
}

- (BOOL)executeUpdate:(NSString*)sql withArgumentsInArray:(NSArray *)arrayArgs
{
    if (!_db) {
        return NO;
    }

    int rc              = 0x00;
    sqlite3_stmt *pStmt = 0x00;

    rc = sqlite3_prepare_v2(_db, [sql UTF8String], -1, &pStmt, 0);
    if (SQLITE_OK != rc) {
        sqlite3_finalize(pStmt);
        return NO;
    }

    id obj;
    int idx = 0;
    int queryCount = sqlite3_bind_parameter_count(pStmt);
    while (idx < queryCount) {
        if (arrayArgs && idx < (int)[arrayArgs count]) {
            obj = [arrayArgs objectAtIndex:(NSUInteger)idx];
        }
        else {
            break;
        }
        idx++;
        sqlite3_bind_text(pStmt, idx, [[obj description] UTF8String], -1, SQLITE_STATIC);
    }

    if (idx != queryCount) {
        NSLog(@"sqlite3_bind_text error: the bind count (%d) is not correct for the # of variables in the query (%d) (%@) (executeUpdate)", idx, queryCount, sql);
        sqlite3_finalize(pStmt);
        return NO;
    }

    rc = sqlite3_step(pStmt);
    if (SQLITE_DONE != rc) {
        NSLog(@"sqlite3_step error: (%d: %s)", rc, sqlite3_errmsg(_db));
        NSLog(@"DB Query: %@", sql);
    }

    rc = sqlite3_finalize(pStmt);
    if (SQLITE_OK != rc) {
        NSLog(@"sqlite3_finalize error: (%d: %s)", rc, sqlite3_errmsg(_db));
        NSLog(@"DB Query: %@", sql);
    }

    return (rc == SQLITE_DONE || rc == SQLITE_OK);
}

- (NSString *)lastErrorMessage
{
    return [NSString stringWithUTF8String:sqlite3_errmsg(_db)];
}

- (BOOL)open
{
    if (_db) {
        return YES;
    }

    int err = sqlite3_open(_databasePath.fileSystemRepresentation, &_db);
    if (err != SQLITE_OK) {
        NSLog(@"error opening!: %d", err);
        return NO;
    }
    
    return YES;
}

@end
