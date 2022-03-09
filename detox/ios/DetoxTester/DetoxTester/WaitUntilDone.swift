//
//  WaitUntilDone.swift
//  DetoxTester
//
//  Created by Asaf Korem (Wix.com).
//

import Foundation

public func WaitUntilDone(closure: @escaping (@escaping () -> Void) -> Void) {
  let semaphore = DispatchSemaphore(value: 0)
  let done: () -> Void = {
    syncLog("`done()` was called", type: .debug)
    semaphore.signal()
  }

  closure(done)

  syncLog("synchronization started")
  semaphore.wait()
  syncLog("synchronization ended")
}
