//
//  Connection.swift
//  SwiftExperiments
//
//  Created by Erik D on 05/06/14.
//  Copyright (c) 2014 Mulle Kybernetik. All rights reserved.
//

import Foundation

@objc
protocol Connection {
    func fetchData() -> String
}

class ServerConnection : NSObject, Connection {
    func fetchData() -> String {
        return "real data returned from other system"
    }
}
