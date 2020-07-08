package com.wix.detox.common

import android.os.Bundle
import org.json.JSONArray
import org.json.JSONObject

class JsonConverter(private val json: JSONObject) {
    fun toBundle(): Bundle = Bundle().apply {
        json.keys().forEach { key: String ->
            when (val value = json.get(key)) {
                is Boolean -> putBoolean(key, value)
                is Integer -> putInt(key, value as Int)
                is java.lang.Long -> putLong(key, value as Long)
                is java.lang.Double -> putDouble(key, value as Double)
                is String -> putString(key, value)
                is JSONObject -> {
                    val subObject = json.getJSONObject(key)
                    val subBundle = JsonConverter(subObject).toBundle()
                    putBundle(key, subBundle)
                }
                is JSONArray -> {
                    val stringArray = parseJsonArrayAsStringsList(value)
                    putStringArrayList(key, stringArray)
                }
            }
        }
    }

    private fun parseJsonArrayAsStringsList(array: JSONArray)
            = ArrayList<String>(array.length()).apply {
                for (i in 0 until array.length()) {
                    val item = array[i]
                    if (item !is String && item !is Number && item !is Boolean) {
                        throw IllegalArgumentException("Non-string arrays not currently supported inside JSON's (failed to parse value: $item)")
                    }
                    add(item.toString())
                }
            }
}
