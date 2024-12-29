package com.example;

import android.os.Bundle;

import androidx.test.runner.AndroidJUnitRunner;

public class DetoxTestAppJUnitRunner extends AndroidJUnitRunner {
    @Override
    public void onStart() {
        super.onStart();
    }

    @Override
    public void finish(int resultCode, Bundle results) {
        super.finish(resultCode, results);
    }
}
