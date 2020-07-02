package com.wix.detox;

import android.app.Application;
import android.os.Bundle;
import android.util.Log;

import androidx.test.runner.AndroidJUnitRunner;
import androidx.test.runner.lifecycle.ApplicationLifecycleCallback;
import androidx.test.runner.lifecycle.ApplicationLifecycleMonitor;
import androidx.test.runner.lifecycle.ApplicationLifecycleMonitorRegistry;
import androidx.test.runner.lifecycle.ApplicationStage;

import com.wix.detox.instruments.DetoxInstrumentsManager;


public class DetoxJUnitRunner extends AndroidJUnitRunner {
    private static final String TAG = "DetoxJUnitRunner";
    private DetoxInstrumentsManager instrumentsManager;
    private ApplicationLifecycleCallback lifecycleCallback;

    @Override
    public void onCreate(final Bundle arguments) {
        super.onCreate(arguments);

        final ApplicationLifecycleMonitor monitor = ApplicationLifecycleMonitorRegistry.getInstance();
        lifecycleCallback = new ApplicationLifecycleCallback() {
            @Override
            public void onApplicationLifecycleChanged(Application app, ApplicationStage stage) {
                if (stage == ApplicationStage.PRE_ON_CREATE) {
                    onBeforeAppOnCreate(app, arguments);
                } else if (stage == ApplicationStage.CREATED) {
                    onAfterAppOnCreate();
                }
            }
        };
        monitor.addLifecycleCallback(lifecycleCallback);
    }

    @Override
    public void onDestroy() {
        instrumentsManager.stopRecording();
        instrumentsManager = null;
        lifecycleCallback = null;

        super.onDestroy();
    }

    private void onBeforeAppOnCreate(Application app, Bundle arguments) {
        final String recordingPath = arguments.getString("detoxInstrumRecPath");
        if (recordingPath != null) {
            if (DetoxInstrumentsManager.supports()) {
                long samplingInterval = 250;
                try {
                    final String interval = arguments.getString("detoxInstrumSamplingInterval");
                    if (interval != null) {
                        samplingInterval = Long.parseLong(interval);
                    }
                } catch (NumberFormatException ignore) {
                    Log.w(TAG, "Invalid value for param \"detoxInstrumSamplingInterval\", default was used");
                }

                instrumentsManager = new DetoxInstrumentsManager(app);
                instrumentsManager.startRecordingAtLocalPath(recordingPath, samplingInterval);
            }
        }
    }

    private void onAfterAppOnCreate() {
        if (instrumentsManager != null) {
            instrumentsManager.tryInstallJsi();
        }
    }
}
