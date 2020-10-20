package com.example;

import android.graphics.Color;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

public class SluggishTextTextViewManager extends SimpleViewManager<ViewGroup> {
    @Override
    public String getName() {
        return "DetoxSluggishTapsTextView";
    }

    @Override
    protected ViewGroup createViewInstance(ThemedReactContext reactContext) {
        final FrameLayout layout = new FrameLayout(reactContext);
        layout.setLayoutParams(new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

        final TextView textView = new TextView(reactContext);
        textView.setTag("sluggishTappableText");
        textView.setLayoutParams(new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER));
        textView.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
        textView.setGravity(Gravity.CENTER);
        textView.setText("Slow-Tap");
        textView.setTextColor(Color.BLUE);

        textView.setOnTouchListener((v, event) -> {
            if (event.getAction() == MotionEvent.ACTION_DOWN) {
                try {
                    Thread.sleep(ViewConfiguration.getLongPressTimeout());
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
            }
            return false;
        });
        textView.setOnClickListener(v -> {});

        layout.addView(textView);
        return layout;
    }
}
