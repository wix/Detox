package com.wix.detox.espresso.matcher

fun String.isMatch(jsRegex: String): Boolean {
    val flagsChars = getRegexFlags(jsRegex)
    val options = getRegexOptions(flagsChars)
    val pattern = getRegexPattern(jsRegex)
    return Regex(pattern, options).matches(this)
}

fun getRegexFlags(jsRegex: String): CharSequence {
    return jsRegex.substringAfterLast("/")
}

fun getRegexPattern(jsRegex: String): String {
    val pattern = jsRegex.substringAfter("/")
    return pattern.substringBeforeLast("/")
}

fun getRegexOptions(flagsChars: CharSequence): MutableSet<RegexOption> {
    val options = mutableSetOf<RegexOption>()

    if (flagsChars.contains('i', ignoreCase = true)) {
        options.add(RegexOption.IGNORE_CASE)
    }
    if (flagsChars.contains('m', ignoreCase = true)) {
        options.add(RegexOption.MULTILINE)
    }
    if (flagsChars.contains('g', ignoreCase = true)) {
        options.add(RegexOption.DOT_MATCHES_ALL)
    }
    if (flagsChars.contains('s', ignoreCase = true)) {
        options.add(RegexOption.DOT_MATCHES_ALL)
    }

    return options
}
