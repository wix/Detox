//
//  NSException+DetoxUtils.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 5/31/20.
//  Copyright © 2020 Wix. All rights reserved.
//

import Foundation

@objc
extension NSException {
	@objc(dtx_demangledCallStackSymbols)
	open var demangledCallStackSymbols : String {
		return Thread.demangledCallStackSymbols(forReturnAddresses: callStackReturnAddresses, startIndex: 0)
	}
}
