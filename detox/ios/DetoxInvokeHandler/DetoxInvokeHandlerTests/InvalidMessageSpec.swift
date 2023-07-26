//
//  InvalidMessageSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class InvalidMessageSpec: QuickSpec {
  override func spec() {
    describe("invalid message") {
      it("should throw for invalid message") {
        let message = ["foo": "bar"]
        expect(try Message(from: message)).to(throwError())
      }
    }
  }
}
