//
//  WaitUntilDone.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Blocks the main-thread until `done` block is called. Can execute operations on the current
/// thread synchronically (without releasing it) by passing false `handleAsync` to `exec`,
/// otherwise executing the operation asynchronically on an arbitrary thread.
func WaitUntilDone(
  closure: @escaping (
    _ done: @escaping () -> Void,
    _ exec: @escaping (_ handleAsync: Bool, @escaping () -> Void) -> Void
  ) -> Void
) {
  let backgroundQueue = DispatchQueue.global(qos: .background)

  let semaphore = DispatchSemaphore(value: 0)

  let done: () -> Void = {
    syncLog("`done()` was called", type: .debug)
    semaphore.signal()
  }

  var waitingToExec: (() -> Void)? = nil

  // Allow only one exec operation to be handled at once.
  let waitingToExecSemaphore = DispatchSemaphore(value: 1)

  let exec: (Bool, @escaping () -> Void) -> Void = { handleAsync, toExec in
    syncLog(
      "`exec` was called (executing \(handleAsync ? "asynchronically" : "synchronically")), " +
      "running on thread: \(Thread.current)",
      type: .debug
    )

    if (handleAsync) {
      backgroundQueue.async {
        syncLog("running on thread: \(Thread.current)")
        syncLog("`exec` started asynchronically", type: .debug)
        toExec()
      }
    } else {
      waitingToExecSemaphore.wait()
      syncLog("next synchronous main-thread execution code block was set by `exec`", type: .debug)

      waitingToExec = toExec

      semaphore.signal()

    }
  }
  
  closure(done, exec)

  syncLog(
    "wait-until-done synchronization started, running on thread: \(Thread.current)",
    type: .debug
  )

  semaphore.wait()

  while let toExec = waitingToExec {
    syncLog("`exec` started on thread: \(Thread.current)", type: .debug)

    waitingToExec = nil
    waitingToExecSemaphore.signal()

    toExec()
    syncLog("execution finished")

    syncLog("waiting on thread: \(Thread.current)")
    semaphore.wait()
  }

  syncLog("wait-until-done synchronization ended on thread: \(Thread.current)")
}
