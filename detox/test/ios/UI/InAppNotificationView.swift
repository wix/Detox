//
//  InAppNotificationView.swift (example)
//  Created by Asaf Korem (Wix.com) on 2024.
//


import UIKit

class InAppNotificationView: UIView {
    
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.numberOfLines = 2
        label.textAlignment = .center
        label.textColor = .white
        label.font = UIFont.boldSystemFont(ofSize: 16)
        return label
    }()
    
    private let closeButton: UIButton = {
        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.setTitle("×", for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 24)
        button.setTitleColor(.white, for: .normal)
        return button
    }()
    
    // MARK: - Init
    
    init(title: String) {
        super.init(frame: .zero)
        translatesAutoresizingMaskIntoConstraints = false
        backgroundColor = UIColor.black.withAlphaComponent(0.7)
        
        titleLabel.text = title
        
        addSubview(titleLabel)
        addSubview(closeButton)
        
        NSLayoutConstraint.activate([
            titleLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
            titleLabel.centerXAnchor.constraint(equalTo: centerXAnchor),
            
            closeButton.topAnchor.constraint(equalTo: topAnchor, constant: 5),
            closeButton.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10),
        ])
        
        closeButton.addTarget(self, action: #selector(didTapClose), for: .touchUpInside)
    }
    
    @objc private func didTapClose() {
        removeFromSuperview()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
