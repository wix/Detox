package com.wix.detox.instruments.reflected;

import android.content.Context;

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
    private static Method methodTryInstallJsiHook;
    private static final boolean hasProfiler;
    private InstrumentsRecording activeRecording;

    static {
        try {
            final String basePackageName = "com.wix.detoxprofiler";
            final Class<?> profilerClass = Class.forName(basePackageName + ".DTXProfiler");
            final Class<?> configurationClass = Class.forName(basePackageName + ".DTXProfilingConfiguration");
            final Class<?> jsiHookClass = Class.forName(basePackageName + ".JsiHook");

            constructorDtxProfilingConfiguration = configurationClass.getConstructor(
                    boolean.class,//recordPerformance
                    long.class,//samplingIntervalMillis
                    File.class,//recordingFile
                    boolean.class//recordReactNativeTimersAsEvents
            );
            methodGetInstanceOfProfiler = profilerClass.getDeclaredMethod("getInstance", Context.class);
            methodStartRecording = profilerClass.getDeclaredMethod("startProfiling", Context.class, configurationClass);
            methodTryInstallJsiHook = jsiHookClass.getDeclaredMethod("tryInstall", profilerClass, Context.class);
            methodTryInstallJsiHook.setAccessible(true);
        } catch (ClassNotFoundException e) {
            methodGetInstanceOfProfiler = null;
        } catch (NoSuchMethodException e) {
            methodGetInstanceOfProfiler = null;
        }
        hasProfiler = methodGetInstanceOfProfiler != null;
    }

    private InstrumentsReflected() {
    }

    @Override
    public boolean installed() {
        return hasProfiler;
    }

    void resetActiveRecording() {
        activeRecording = null;
    }

    public InstrumentsRecording getActiveRecording() {
        return activeRecording;
    }

    @Override
    public void tryInstallJsiHook(Context context) {
        try {
            final Object profilerInstance = methodGetInstanceOfProfiler.invoke(null, context);
            methodTryInstallJsiHook.invoke(null, profilerInstance, context);
        } catch (Exception e) {
            throw new DetoxInstrumentsException(e);
        }
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
            activeRecording = new InstrumentsRecordingReflected(profilerInstance, this);
            return activeRecording;
        } catch (Exception e) {
            throw new DetoxInstrumentsException(e);
        }
    }

    public static Instruments getInstance() {
        return instance;
    }
}
