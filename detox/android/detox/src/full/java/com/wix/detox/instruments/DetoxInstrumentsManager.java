package com.wix.detox.instruments;

import android.content.Context;

import com.wix.detox.instruments.reflected.InstrumentsReflected;

import java.io.File;

public class DetoxInstrumentsManager {

    private final Context context;
    private final Instruments instruments;
    private InstrumentsRecording recording;

    public DetoxInstrumentsManager(Context context) {
        this(context, getDefaultInstruments());
    }

    public DetoxInstrumentsManager(Context context, Instruments instruments) {
        this.context = context;
        this.instruments = instruments;
        this.recording = instruments.getActiveRecording();
    }

    public void tryInstallJsi() {
        if (!instruments.installed()) {
            return;
        }
        instruments.tryInstallJsiHook(context);
    }

    public void startRecordingAtLocalPath(String path, long samplingInterval) {
        if (!instruments.installed()) {
            return;
        }

        recording = instruments.startRecording(context, true, samplingInterval, new File(path), false);
    }

    public void stopRecording() {
        if (recording != null) {
            recording.stop();
            recording = null;
        }
    }

    public void eventBeginInterval(
            String category,
            String name,
            String id,
            String additionalInfo
    ) {
        if (recording != null) {
            recording.eventBeginInterval(category, name, id, additionalInfo);
        }
    }

    public void eventEndInterval(
            String id,
            String eventStatus,
            String additionalInfo
    ) {
        if (recording != null) {
            recording.eventEndInterval(id, eventStatus, additionalInfo);
        }
    }

    public void eventMark(
            String category,
            String name,
            String id,
            String eventStatus,
            String additionalInfo
    ) {
        if (recording != null) {
            recording.eventMark(category, name, id, eventStatus, additionalInfo);
        }
    }

    public static boolean supports() {
        return getDefaultInstruments().installed();
    }

    private static Instruments getDefaultInstruments() {
        return InstrumentsReflected.getInstance();
    }
}
