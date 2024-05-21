//
//  ContentView.swift (DetoxXCUITestRunnerApp)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import SwiftUI

struct ContentView: View {
  var body: some View {
    VStack {
      Image(systemName: "xmark")
        .imageScale(.large)
        .foregroundColor(.red)
      Text("Not a real app")
        .font(.title)
      Text("Detox XCUITest Runner")
        .font(.subheadline)
    }
    .padding()
    .border(.gray)
    .shadow(radius: 3, x: 2, y: 2)
  }
}
