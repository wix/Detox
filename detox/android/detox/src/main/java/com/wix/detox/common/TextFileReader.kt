package com.wix.detox.common

import java.io.File

class TextFileReader(private val fileName: String) {
    fun read() = File(fileName).inputStream().readBytes().toString(Charsets.UTF_8)
}
