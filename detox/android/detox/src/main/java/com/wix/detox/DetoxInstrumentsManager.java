package com.wix.detox;

import android.content.Context;
import android.util.Log;

import java.io.File;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;

public class DetoxInstrumentsManager {
    private static Constructor constructorDtxProfilingConfiguration;
    private static Method methodGetInstanceOfProfiler;
    private static Method methodStartRecording;
    private static Method methodStopRecording;
    private static Method methodEventBeginInterval;
    private static Method methodEventEndInterval;
    private static Method methodEventMark;
    private static final boolean hasProfiler;

    static {
        try {
            final String basePackageName = "com.wix.detoxprofiler";
            final Class<?> profilerClass = Class.forName(basePackageName + ".DTXProfiler");
            final Class<?> configurationClass = Class.forName(basePackageName + ".DTXProfilingConfiguration");

            constructorDtxProfilingConfiguration = configurationClass.getConstructor(
                    boolean.class,//recordPerformance
                    long.class,//samplingIntervalMillis
                    File.class,//recordingFile
                    boolean.class//recordReactNativeTimersAsEvents
            );
            methodGetInstanceOfProfiler = profilerClass.getDeclaredMethod("getInstance", Context.class);
            methodStartRecording = profilerClass.getDeclaredMethod("startProfiling", Context.class, configurationClass);
            methodStopRecording = profilerClass.getDeclaredMethod("stopProfiling");
            methodEventBeginInterval = profilerClass.getDeclaredMethod("eventBeginInterval", String.class, String.class, String.class, String.class, String.class);
            methodEventEndInterval = profilerClass.getDeclaredMethod("eventEndInterval", String.class, String.class, String.class);
            methodEventMark = profilerClass.getDeclaredMethod("eventMark", String.class, String.class, String.class, String.class, String.class);
        } catch (Exception e) {
            Log.i("DetoxInstrumentsManager", "Instruments not found", e);

            constructorDtxProfilingConfiguration = null;
            methodGetInstanceOfProfiler = null;
            methodStartRecording = null;
            methodStopRecording = null;
            methodEventBeginInterval = null;
            methodEventEndInterval = null;
            methodEventMark = null;
        }
        hasProfiler = methodGetInstanceOfProfiler != null;
    }

    private final Context context;
    private Object dtxProfilerInstance;

    DetoxInstrumentsManager(Context context) {
        this.context = context;
    }

    void startRecordingAtLocalPath(String path) {
        if (!hasProfiler) {
            return;
        }
        if (dtxProfilerInstance == null) {
            dtxProfilerInstance = obtainProfiler();
        }
        final Object configuration = newConfiguration(path);
        try {
            methodStartRecording.invoke(dtxProfilerInstance, context, configuration);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    void stopRecording() {
        if (!hasProfiler) {
            return;
        }
        if (dtxProfilerInstance == null) {
            return;
        }
        try {
            methodStopRecording.invoke(dtxProfilerInstance);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    void eventBeginInterval(String category, String name, String id, String additionalInfo) {
        if (dtxProfilerInstance == null) {
            return;
        }
        try {
            methodEventBeginInterval.invoke(dtxProfilerInstance, category, name, id, additionalInfo);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    void eventEndInterval(String id, String eventStatus, String additionalInfo) {
        if (dtxProfilerInstance == null) {
            return;
        }
        try {
            methodEventEndInterval.invoke(dtxProfilerInstance, id, eventStatus, additionalInfo);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    void eventMark(String category, String name, String id, String eventStatus, String additionalInfo) {
        if (dtxProfilerInstance == null) {
            return;
        }
        try {
            methodEventMark.invoke(dtxProfilerInstance, category, name, id, eventStatus, additionalInfo);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static Object newConfiguration(String path) {
        try {
            return constructorDtxProfilingConfiguration.newInstance(
                    true,//recordPerformance
                    500L,//samplingIntervalMillis
                    new File(path),//recordingFile
                    false//recordReactNativeTimersAsEvents
            );
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private Object obtainProfiler() {
        try {
            return methodGetInstanceOfProfiler.invoke(null, context);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
