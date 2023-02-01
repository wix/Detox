//
//  CFRunLoopDescription.m
//  DetoxSync
//
//  Created by Leo Natan (Wix) on 12/24/19.
//  Copyright © 2019 wix. All rights reserved.
//

#import "CFRunLoopDescription.h"

extern atomic_cfrunloop __RNRunLoop;
static CFRunLoopRef _mainRunLoop;

NSString* _DTXCFRunLoopDescription(CFRunLoopRef _runLoop, NSString* name)
{
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		_mainRunLoop = CFRunLoopGetMain();
	});
	CFRunLoopRef rnLoop = atomic_load(&__RNRunLoop);
	
	return _runLoop == _mainRunLoop ? @"Main Run Loop" : (rnLoop != NULL && _runLoop == rnLoop) ? @"JS Run Loop" : [NSString stringWithFormat:@"%@: %p>", name == nil ? @"<CFRunLoop" : [NSString stringWithFormat:@"%@ <CFRunLoop", name], _runLoop];
}
