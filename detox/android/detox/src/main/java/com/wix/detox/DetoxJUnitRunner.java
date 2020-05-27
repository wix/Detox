package com.wix.detox;

import android.app.Application;
import android.os.Bundle;

import androidx.test.runner.AndroidJUnitRunner;
import androidx.test.runner.lifecycle.ApplicationLifecycleCallback;
import androidx.test.runner.lifecycle.ApplicationLifecycleMonitor;
import androidx.test.runner.lifecycle.ApplicationLifecycleMonitorRegistry;
import androidx.test.runner.lifecycle.ApplicationStage;

import com.wix.detox.instruments.DetoxInstrumentsManager;


public class DetoxJUnitRunner extends AndroidJUnitRunner {
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
        if (DetoxInstrumentsManager.supports()) {
            final String recordingPath = arguments.getString("detoxInstrumRecPath");
            if (recordingPath != null) {
                final long samplingInterval = Long.parseLong(
                        arguments.getString("detoxInstrumSamplingInterval", "250")
                );

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
