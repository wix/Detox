package com.example;

import android.os.Bundle;

import androidx.test.runner.AndroidJUnitRunner;
import com.wix.detoxbutler.DetoxButler;


public class DetoxTestAppJUnitRunner extends AndroidJUnitRunner {
    @Override
    public void onStart() {
        DetoxButler.setup(getTargetContext());
        super.onStart();
    }

    @Override
    public void finish(int resultCode, Bundle results) {
        DetoxButler.teardown(getTargetContext());
        super.finish(resultCode, results);
    }
}
