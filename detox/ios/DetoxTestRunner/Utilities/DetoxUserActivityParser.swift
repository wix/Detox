//
//  DetoxUserActivityParser.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 10/16/19.
//

import Foundation

public class DetoxUserActivityParser : NSObject {
	public class func parseUserActivityData(url: URL) -> [String: Any] {
		guard let data = try? Data.init(contentsOf: url) else {
			Swift.fatalError("Unable to read user activity data file.")
		}
		
		guard let jsonObject = (try? JSONSerialization.jsonObject(with: data, options: .init(rawValue: 0)) as? [String: Any]) else {
			Swift.fatalError("Unable to parse user activity data file.")
		}
		
		return jsonObject
	}

}
