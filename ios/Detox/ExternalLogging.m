//
//  ExternalLogging.c
//  Detox
//
//  Created by Leo Natan (Wix) on 11/7/18.
//  Copyright © 2018 Wix. All rights reserved.
//

#include "ExternalLogging.h"
#include "DTXLogging.h"

DTX_CREATE_LOG(External)

void __dtx_send_external_log(const char* log)
{
	dtx_log_info(@"%s", log);
}
