//
//  WebActionType.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

enum WebActionType: String, Codable {
	case tap = "tap"
	case typeText = "typeText"
	case replaceText = "replaceText"
	case clearText = "clearText"
	case selectAllText = "selectAllText"
	case getText = "getText"
	case scrollToView = "scrollToView"
	case focus = "focus"
	case moveCursorToEnd = "moveCursorToEnd"
	case runScript = "runScript"
	case runScriptWithArgs = "runScriptWithArgs"
	case getCurrentUrl = "getCurrentUrl"
	case getTitle = "getTitle"
}
