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

# Do not strip any method/class that is annotated with @DoNotStrip
# This should really come from React Native itself. See here: https://github.com/react-native-community/upgrade-support/issues/31
-keep @com.facebook.jni.annotations.DoNotStrip class *
-keep class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
    @com.facebook.jni.annotations.DoNotStrip *;
}
-keepclassmembers class * {
    @com.facebook.jni.annotations.DoNotStrip *;
}
