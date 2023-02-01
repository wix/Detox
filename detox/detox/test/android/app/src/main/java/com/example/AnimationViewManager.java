package com.example;

import android.animation.Animator;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.example.utils.AnimatorListenerStub;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

public class AnimationViewManager extends SimpleViewManager<View> {

    @Override
    public String getName() {
        return "DetoxNativeAnimatingView";
    }

    @Override
    protected View createViewInstance(ThemedReactContext reactContext) {
        final ViewGroup rootView = (ViewGroup) LayoutInflater.from(reactContext).inflate(R.layout.animation_test, null, false);
        final ProgressBar progressBar = rootView.findViewById(R.id.animationTest_progressBar);
        final TextView statusText = rootView.findViewById(R.id.animationTest_statusText);

        final ValueAnimator animator = ObjectAnimator.ofInt(0, 100);
        animator.setDuration(5000);
        animator.addUpdateListener(animation -> {
            Integer value = (Integer) animation.getAnimatedValue();
            progressBar.setProgress(value);
        });
        animator.addListener(new AnimatorListenerStub() {
            @Override
            public void onAnimationEnd(Animator animation) {
                statusText.setVisibility(View.VISIBLE);
            }
        });

        final Button button = rootView.findViewById(R.id.animationTest_button);
        button.setOnClickListener(view -> {
            button.setEnabled(false);
            animator.start();
        });

        return rootView;
    }
}
