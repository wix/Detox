//
//  TimeInterval+DetoxUtils.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 5/12/20.
//  Copyright © 2020 Wix. All rights reserved.
//

import Foundation

extension TimeInterval {
	func fromMSToSeconds() -> TimeInterval {
		return (self / 1000.0).truncatingRemainder(dividingBy: 1000)
	}
}
