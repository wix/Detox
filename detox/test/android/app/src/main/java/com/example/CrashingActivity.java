package com.example;

public class CrashingActivity extends MainActivity {
    @Override
    protected void onResume() {
        super.onResume();
        throw new IllegalStateException("This is an intentional crash!");
    }
}
