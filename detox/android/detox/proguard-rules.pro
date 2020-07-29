-dontwarn org.xmlpull.**
-dontwarn sun.misc.**

-dontnote android.**
-dontnote androidx.**
-dontnote java.**
-dontnote javax.**
-dontnote kotlin.**
-dontnote org.apache.**
-dontnote junit.**
-dontnote org.junit.**
-dontnote org.joor.**
-dontnote org.hamcrest.**
-dontnote com.facebook.**

# Detox dynamic access to declared methods of RN's timing module

-keep class com.facebook.react.modules.core.TimingModule { *; } # RN >= .63
-keep class com.facebook.react.modules.core.Timing { *; } # RN <= .62
-dontnote com.wix.detox.reactnative.idlingresources.timers.**

# Detox profiler (optional)

-keep class com.wix.detoxprofiler.** { *; }
-dontnote  com.wix.detox.instruments.reflected.**
