package com.wix.detox.instruments.reflected;

import android.content.Context;
import android.util.Log;

import com.wix.detox.instruments.DetoxInstrumentsException;
import com.wix.detox.instruments.Instruments;
import com.wix.detox.instruments.InstrumentsRecording;

import java.io.File;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;

public class InstrumentsReflected implements Instruments {
    private static final InstrumentsReflected instance = new InstrumentsReflected();

    private static Constructor constructorDtxProfilingConfiguration;
    private static Method methodGetInstanceOfProfiler;
    private static Method methodStartRecording;
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
        } catch (Exception e) {
            Log.i("DetoxInstrumentsManager", "InstrumentsRecording not found", e);

            constructorDtxProfilingConfiguration = null;
            methodGetInstanceOfProfiler = null;
            methodStartRecording = null;
        }
        hasProfiler = methodGetInstanceOfProfiler != null;
    }

    private InstrumentsReflected() {
    }

    @Override
    public boolean installed() {
        return hasProfiler;
    }

    @Override
    public InstrumentsRecording startRecording(
            Context context,
            boolean recordPerformance,
            long samplingInterval,
            File recordingFile,
            boolean recordReactNativeTimersAsEvents
    ) {
        try {
            final Object configurationInstance = constructorDtxProfilingConfiguration.newInstance(
                    recordPerformance,
                    samplingInterval,
                    recordingFile,
                    recordReactNativeTimersAsEvents
            );
            final Object profilerInstance = methodGetInstanceOfProfiler.invoke(null, context);
            methodStartRecording.invoke(profilerInstance, context, configurationInstance);
            return new InstrumentsRecordingReflected(profilerInstance);
        } catch (Exception e) {
            throw new DetoxInstrumentsException(e);
        }
    }

    public static Instruments getInstance() {
        return instance;
    }
}
