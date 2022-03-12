//
//  WaitUntilDone.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

class WaitUntilDone {
  var didCallDone: Bool = false

  public func start(closure: @escaping (@escaping () -> Void) -> Void) {
    let done: () -> Void = { [self] in
      syncLog("`done()` was called", type: .debug)
      didCallDone = true
    }

    closure(done)

    syncLog("synchronization started (thread: \(Thread.current.description))")

    waitOperation()

    syncLog("synchronization ended")
  }

  private func waitOperation() {
    guard didCallDone == false else {
      syncLog("wait operation is cancelled")
      return
    }

    syncLog("thread sleep for 0.2 seconds")
    Thread.sleep(forTimeInterval: 0.2)

    // Dispatch `waitOperation` again.
    OperationQueue.main.addOperation { [self] in
      waitOperation()
    }
  }
}
