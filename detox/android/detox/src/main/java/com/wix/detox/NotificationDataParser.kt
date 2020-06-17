package com.wix.detox

import android.os.Bundle
import com.wix.detox.common.JsonConverter
import com.wix.detox.common.TextFileReader
import org.json.JSONObject

internal class NotificationDataParser(private val notificationPath: String) {
    fun parseNotificationData(): Bundle {
        val rawData = readNotificationData()
        val json = JSONObject(rawData)
        val payload = json.getJSONObject("payload")
        return JsonConverter(payload).toBundle()
    }

    private fun readNotificationData()
            = TextFileReader(notificationPath).read()
}
