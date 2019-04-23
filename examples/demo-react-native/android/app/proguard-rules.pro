#
# Most needed rules come from React Native's proguard-rules.pro (either .aar or source) -- hence
# the lean configuration file.
###

-dontobfuscate

-dontnote android.net.**
-dontnote org.apache.**

# An addition to RN's 'keep' and 'dontwarn' configs -- need to also 'dontnote' some stuff.

-dontnote com.facebook.**
-dontnote sun.misc.Unsafe
-dontnote okhttp3.**
-dontnote okio.**
