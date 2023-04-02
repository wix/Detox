//
//  TapViewController.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

class TapViewController: UIViewController {
  @IBOutlet var tapButton: UIButton!
  @IBOutlet var label: UILabel!

  override func viewDidLoad() {
    super.viewDidLoad()

    let tapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(tapped))
    tapButton.addGestureRecognizer(tapGestureRecognizer)
  }

  @objc private func tapped() {
    print("Tap button tapped")
    label.text = "Success!"
  }
}
