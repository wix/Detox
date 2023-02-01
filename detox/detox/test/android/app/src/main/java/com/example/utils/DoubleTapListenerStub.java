package com.example.utils;

import android.view.GestureDetector;
import android.view.MotionEvent;

public class DoubleTapListenerStub implements GestureDetector.OnDoubleTapListener {
    @Override
    public boolean onSingleTapConfirmed(MotionEvent e) {
        return false;
    }

    @Override
    public boolean onDoubleTap(MotionEvent e) {
        return false;
    }

    @Override
    public boolean onDoubleTapEvent(MotionEvent e) {
        return false;
    }
}
