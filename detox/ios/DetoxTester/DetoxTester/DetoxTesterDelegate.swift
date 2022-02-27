//
//  DetoxTesterDelegate.swift
//  DetoxTester
//
//  Created by Asaf Korem (Wix.com).
//

import Foundation

/// Delegate for `DetoxTester`, used for starting the tester's web-socket and handling the received
/// messages from Detox server.
@objc public class DetoxTesterDelegate: NSObject {
  @objc static public func start() {
    let webSocket = WSFacade()
    webSocket.connect()

    var i: uint = 1
    while (true) {
      i += 1
      webSocket.send(message: "Some Message #\(i)")
      webSocket.receive()

      print("sleep for 1 second...")
      Thread.sleep(forTimeInterval: 1)
    }
  }
}
