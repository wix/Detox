//
//  NSThread+DetoxUtils.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 5/31/20.
//  Copyright © 2020 Wix. All rights reserved.
//

import Foundation

@objc
extension Thread {
	@objc(dtx_demangledCallStackSymbols)
	open class var demangledCallStackSymbols : String {
		return demangledCallStackSymbolsFor(returnAddresses: callStackReturnAddresses, startIndex: 2)
	}
	
	internal static func demangledCallStackSymbolsFor(returnAddresses: [NSNumber], startIndex: Int) -> String {
		let symbols = returnAddresses[startIndex..<returnAddresses.count].enumerated().map {
			DTXAddressInfo(address: UInt(truncating: $1)).formattedDescription(for: UInt($0))
		}
		return "(\n\t\(symbols.joined(separator: "\n\t"))\n)"
	}
}
