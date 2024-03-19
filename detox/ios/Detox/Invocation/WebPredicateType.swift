//
//  WebPredicateType.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

enum WebPredicateType: String, Codable {
	case id = "id"
	case className = "class"
	case cssSelector = "css"
	case name = "name"
	case xpath = "xpath"
	case href = "href"
	case hrefContains = "hrefContains"
	case tag = "tag"
	case label = "label"
	case value = "value"
}
