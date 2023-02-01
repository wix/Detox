//
//  ViewController.swift
//  ViewHierarchyDumpTester
//
//  Created by Leo Natan (Wix) on 7/3/20.
//

import UIKit
import MobileCoreServices
import LNViewHierarchyDumper

extension UIColor {
	static func withSeed(_ seed: String) -> UIColor {
		srand48(seed.hash &+ 200)
		let r = CGFloat(1.0 - drand48())
		
		srand48(seed.hash)
		let g = CGFloat(drand48())
		
		srand48(seed.hash &- 200)
		let b = CGFloat(1.0 - drand48())
		
		return UIColor(red: r, green: g, blue: b, alpha: 1.0)
	}
}

class SelfColoringView: UIView {
	override func didMoveToWindow() {
		super.didMoveToWindow()
		
		if let window = window, let windowScene = window.windowScene {
			backgroundColor = UIColor.withSeed(windowScene.session.persistentIdentifier)
		}
	}
}

class ViewController: UIViewController, UIDocumentPickerDelegate {
	@IBAction func newWindow(_ sender: UIButton) {
		UIApplication.shared.requestSceneSessionActivation(nil, userActivity: nil, options: nil, errorHandler: nil)
	}
	
	@IBAction func dumpHierarchy(_ sender: Any) {
		#if targetEnvironment(macCatalyst)
		let picker = UIDocumentPickerViewController(documentTypes: [kUTTypeFolder as String], in: .open)
		picker.delegate = self
		self.present(picker, animated: true, completion: nil)
		#else
		let somePath = NSHomeDirectory()
		let userPath = somePath[somePath.startIndex..<somePath.range(of: "/Library")!.lowerBound]
		try! LNViewHierarchyDumper.shared.dumpViewHierarchy(to: URL(fileURLWithPath: String(userPath)).appendingPathComponent("Desktop"))
		#endif
	}
	
	#if targetEnvironment(macCatalyst)
	func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
		if let url = urls.first {
			try! LNViewHierarchyDumper.shared.dumpViewHierarchy(to: url)
		}
	}
	#endif
}

