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
    semaphore.signal()
  }

  closure(done)
  semaphore.wait()
}
