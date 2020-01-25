package com.wix.detox.instruments;

import android.content.Context;

import java.io.File;

public interface Instruments {
    boolean installed();

    InstrumentsRecording startRecording(
            Context context,
            boolean recordPerformance,
            long samplingInterval,
            File recordingFile,
            boolean recordReactNativeTimersAsEvents
    );
}
