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

-keep class org.apache.commons.lang3.** { *; }
-keep class org.apache.commons.io.** { *; }

# Detox profiler (optional)

-keep class com.wix.detoxprofiler.** { *; }
-dontnote  com.wix.detox.instruments.reflected.**

-dontwarn androidx.appcompat.**
-dontwarn javax.lang.model.element.**
