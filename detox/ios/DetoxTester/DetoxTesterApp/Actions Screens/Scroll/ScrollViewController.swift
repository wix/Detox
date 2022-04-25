//
//  ScrollViewController.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

class ScrollViewController: UIViewController {
  @IBOutlet var scrollView: UIScrollView!
  @IBOutlet var innerView: UIView!
//  @IBOutlet var label: UILabel!

  override func viewWillLayoutSubviews() {
    scrollView.contentSize = innerView.frame.size
  }

  override func viewDidLoad() {
    super.viewDidLoad()

//    let tapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(tapped))
//    tapButton.addGestureRecognizer(tapGestureRecognizer)
  }
//
//  @objc private func tapped() {
//    print("Tap button tapped")
//    label.text = "Success!"
//  }
}
