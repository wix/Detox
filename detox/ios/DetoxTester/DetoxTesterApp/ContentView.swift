//
//  ContentView.swift (SwiftUIExampleApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import SwiftUI

struct ContentView: View {
  var body: some View {
    Color.init(red: 0.9, green: 0.9, blue: 1)
      .ignoresSafeArea(.all, edges: .vertical)
      .overlay(VStack(spacing: 10) {

      ActionsMenu()
    })
  }
}

struct ContentView_Previews: PreviewProvider {
  static var previews: some View {
    ContentView()
  }
}
