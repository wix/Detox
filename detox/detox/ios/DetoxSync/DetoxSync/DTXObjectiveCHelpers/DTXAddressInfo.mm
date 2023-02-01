//
//  DTXAddressInfo.m
//  DTXObjectiveCHelpers
//
//  Created by Leo Natan (Wix) on 07/07/2017.
//  Copyright © 2017-2020 Wix. All rights reserved.
//

#import "DTXAddressInfo.h"
#include <dlfcn.h>
#include <cxxabi.h>

static char* (*__dtx_swift_demangle)(const char *mangledName,
									 size_t mangledNameLength,
									 char *outputBuffer,
									 size_t *outputBufferSize,
									 uint32_t flags);

@implementation DTXAddressInfo
{
	Dl_info _info;
}

@synthesize image, symbol, offset, address;

+ (void)load
{
	__dtx_swift_demangle = (char*(*)(const char *, size_t, char *, size_t *, uint32_t))dlsym(RTLD_DEFAULT, "swift_demangle");
}

- (instancetype)initWithAddress:(NSUInteger)_address
{
	self = [super init];
	
	if(self)
	{
		address = _address;
		dladdr((void*)address, &_info);
	}
	
	return self;
}

- (NSString *)image
{
	if(_info.dli_fname != NULL)
	{
		NSString* potentialImage = [NSString stringWithUTF8String:_info.dli_fname];
		
		if([potentialImage containsString:@"/"])
		{
			return potentialImage.lastPathComponent;
		}
	}
	
	return @"???";
}

- (NSString *)symbol
{
	if(_info.dli_sname != NULL)
	{
		int status = -1;
		char* demangled = nullptr;
		BOOL shouldFree = NO;
		
		if((demangled = abi::__cxa_demangle(_info.dli_sname, nullptr, nullptr, &status)) != nullptr ||
		   (__dtx_swift_demangle && (demangled = __dtx_swift_demangle(_info.dli_sname, strlen(_info.dli_sname), nullptr, nullptr, 0)) != nullptr))
		{
			shouldFree = YES;
		}
		
		if(demangled == nullptr)
		{
			demangled = (char *)_info.dli_sname;
			shouldFree = NO;
		}
		
		NSString* tmpSymbol = [NSString stringWithUTF8String:demangled];
		
		if(shouldFree)
		{
			free(demangled);
		}
		
		return tmpSymbol;
	}
	else if(_info.dli_fname != NULL)
	{
		return self.image;
	}
	
	return [NSString stringWithFormat:@"0x%1lx", (unsigned long)_info.dli_saddr];
}

- (NSUInteger)offset
{
	NSString* str = nil;
	if(_info.dli_sname != NULL && (str = [NSString stringWithUTF8String:_info.dli_sname]) != nil)
	{
		return address - (NSUInteger)_info.dli_saddr;
	}
	else if(_info.dli_fname != NULL && (str = [NSString stringWithUTF8String:_info.dli_fname]) != nil)
	{
		return address - (NSUInteger)_info.dli_fbase;
	}
	
	return address - (NSUInteger)_info.dli_saddr;
}

- (NSString*)formattedDescriptionForIndex:(NSUInteger)index;
{
#if __LP64__
	return [NSString stringWithFormat:@"%-4ld%-35s 0x%016llx %@ + %ld", index, self.image.UTF8String, (uint64_t)address, self.symbol, self.offset];
#else
	return [NSString stringWithFormat:@"%-4d%-35s 0x%08lx %@ + %d", index, self.image.UTF8String, (unsigned long)address, self.symbol, self.offset];
#endif
}

@end
