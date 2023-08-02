//
//  WebScreen.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation
import UIKit
import WebKit

class WebViewController: UIViewController, WKNavigationDelegate {

  var webView: WKWebView!

  override func viewDidLoad() {
    super.viewDidLoad()

    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
          let statusBarManager = windowScene.statusBarManager else { return }

    let navigationBar = UINavigationBar(frame: CGRect(x: 0, y: statusBarManager.statusBarFrame.height, width: view.frame.size.width, height: 44))
    self.view.addSubview(navigationBar)
    let navigationItem = UINavigationItem(title: "Web View")
    let doneButton = UIBarButtonItem(barButtonSystemItem: .done, target: self, action: #selector(dismissWebView))
    navigationItem.rightBarButtonItem = doneButton
    navigationBar.setItems([navigationItem], animated: false)

    webView = WKWebView(frame: CGRect(x: 0, y: navigationBar.frame.origin.y + navigationBar.frame.size.height, width: view.frame.size.width, height: view.frame.size.height - navigationBar.frame.size.height))
    webView.navigationDelegate = self
    view.addSubview(webView)

    let html = """
        <!DOCTYPE html>
        <html>
        <head>
        <style>
            body {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
                padding: 20px;
                box-sizing: border-box;
            }

            h1 {
                font-size: 3em;
                margin: 20px;
            }

            #myLabel {
                font-size: 2.5em;
                margin: 20px;
            }

            button {
                margin: 20px;
                padding: 15px;
                background-color: #4CAF50;
                border: none;
                color: white;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 3em;
                border-radius: 10px;
                cursor: pointer;
            }

            input[type=text] {
                width: 90%;
                padding: 15px;
                margin: 20px;
                font-size: 2em;
                border-radius: 10px;
                border: 2px solid #ccc;
            }

        </style>
        <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-eval'; object-src 'none';">
        </head>
        <body>

        <h1>This is a Web View</h1>

        <button type="button" onclick="myFunction()">Press me!</button>

        <input type="text" id="myText" placeholder="Enter some text..." aria-label="Enter text">
        <p id="myLabel"></p>

        <script>
            function myFunction() {
                var x = document.getElementById("myText").value;
                document.getElementById("myLabel").innerHTML = x;
            }
        </script>
        </body>
        </html>
        """
    webView.loadHTMLString(html, baseURL: nil)
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    let script = """
      var element = document.querySelector('h1');
      if (element) {
          element.setAttribute('aria-label', 'hello-world');
          element.innerText;
      } else {
          'No h1 element found';
      }
      """
    webView.evaluateJavaScript(script) { (result, error) in
      if error == nil {
        if let content = result as? String {
          print("Content of the H1 element: \(content)")
        }
      } else {
        print("JS execution failed: \(error!.localizedDescription)")
      }
    }
  }

  @objc func dismissWebView() {
    self.dismiss(animated: true, completion: nil)
  }
}
