//
//  Controller.swift
//  SwiftExperiments
//
//  Created by Erik D on 05/06/14.
//  Copyright (c) 2014 Mulle Kybernetik. All rights reserved.
//

import Foundation

class Controller: NSObject {
    var connection: Connection;
    var data: String;
    
    class func newController() -> Controller {
        return Controller()
    }
    
    override init() {
        self.connection = ServerConnection();
        self.data = "";
    }
    
    func redisplay() {
        data = connection.fetchData();
    }
}
