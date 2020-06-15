package com.wix.detox

import android.os.Bundle
import com.wix.detox.common.JsonConverter
import com.wix.detox.common.TextFileReader
import org.json.JSONObject

class NotificationDataParser(private val notificationPath: String) {
    fun parseNotificationData(): Bundle {
        val rawData = readNotificationData()
        val json = JSONObject(rawData)
        return JsonConverter(json).toBundle()
    }

    private fun readNotificationData()
            = TextFileReader(notificationPath).read()
}
