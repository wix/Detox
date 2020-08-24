//
//  String+LocalizedError.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 6/7/20.
//  Copyright © 2020 Wix. All rights reserved.
//

extension String: LocalizedError {
    public var errorDescription: String? { return self }
}
