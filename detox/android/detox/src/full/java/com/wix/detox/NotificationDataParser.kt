package com.wix.detox

import android.os.Bundle
import com.wix.detox.common.JsonConverter
import com.wix.detox.common.TextFileReader
import org.json.JSONObject

class NotificationDataParser(private val notificationPath: String) {
    fun toBundle(): Bundle {
        val rawData = readNotificationFromFile()
        val json = JSONObject(rawData)
        val payload = json.getJSONObject("payload")
        return JsonConverter(payload).toBundle()
    }

    private fun readNotificationFromFile()
            = TextFileReader(notificationPath).read()
}
