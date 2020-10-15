package com.example;

import android.graphics.Color;
import android.os.Build;
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

import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import androidx.annotation.RequiresApi;

@RequiresApi(api = Build.VERSION_CODES.N)
public class SluggishTextTextViewManager extends SimpleViewManager<ViewGroup> {
    private ExecutorService exec = Executors.newFixedThreadPool(10);

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
            Log.e("DBGDBG", ("[t="+Thread.currentThread().getName()) + " Handling event: " + event.getAction());
            if (event.getAction() == MotionEvent.ACTION_DOWN) {
                try {
                    for (int i = 0; i < 10; i++) {
                        final int id = i;
                        exec.execute(() -> {
                            Log.e("DBGDBG", "Heavy task #"+id+" started");
                            for (long x = 0; x < 1000000000; x++);
                            Log.e("DBGDBG", "Heavy task #"+id+" completed");
                        });
                    }

                    Thread.sleep(/*ViewConfiguration.getLongPressTimeout()*/10L);
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
