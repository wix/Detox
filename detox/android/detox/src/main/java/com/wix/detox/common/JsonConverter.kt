package com.wix.detox.common

import android.os.Bundle
import org.json.JSONArray
import org.json.JSONObject

internal class JsonConverter(private val json: JSONObject) {
    fun toBundle(): Bundle {
        val bundle = Bundle()
        json.keys().forEach { key: String ->
            when (val value = json.get(key)) {
                is Boolean -> bundle.putBoolean(key, value)
                is Integer -> bundle.putInt(key, value as Int)
                is java.lang.Long -> bundle.putLong(key, value as Long)
                is java.lang.Double -> bundle.putDouble(key, value as Double)
                is String -> bundle.putString(key, value)
                is JSONObject -> {
                    val subObject = json.getJSONObject(key)
                    val subBundle = JsonConverter(subObject).toBundle()
                    bundle.putBundle(key, subBundle)
                }
                is JSONArray -> {
                    val stringArray = parseJsonArrayAsStringsList(value)
                    bundle.putStringArrayList(key, stringArray)
                }
            }
        }
        return bundle
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
