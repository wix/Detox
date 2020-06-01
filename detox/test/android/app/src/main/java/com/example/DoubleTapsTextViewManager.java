package com.example;

import android.graphics.Color;
import android.view.GestureDetector;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.example.utils.DoubleTapListenerStub;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

public class DoubleTapsTextViewManager extends SimpleViewManager<ViewGroup> {
    private static class ViewState {
        int taps = 0;
    }

    @Override
    public String getName() {
        return "DetoxDoubleTapsTextView";
    }

    @Override
    protected ViewGroup createViewInstance(ThemedReactContext reactContext) {
        final ViewState viewState = new ViewState();

        final FrameLayout layout = new FrameLayout(reactContext);
        layout.setLayoutParams(new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

        final TextView textView = new TextView(reactContext);
        textView.setTag("doubleTappableText");
        textView.setLayoutParams(new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER));
        textView.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
        textView.setGravity(Gravity.CENTER);
        textView.setText("Double-Taps: "+viewState.taps);
        textView.setTextColor(Color.BLUE);

        final GestureDetector gestureDetector = new GestureDetector(reactContext, new GestureDetector.SimpleOnGestureListener());
        gestureDetector.setOnDoubleTapListener(new DoubleTapListenerStub() {
            @Override
            public boolean onDoubleTap(MotionEvent e) {
                viewState.taps++;
                textView.setText("Double-Taps: "+viewState.taps);
                return true;
            }
        });
        textView.setOnTouchListener((v, event) -> gestureDetector.onTouchEvent(event));
        textView.setOnClickListener(v -> {});

        layout.addView(textView);
        return layout;
    }
}
