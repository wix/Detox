package com.example.utils;

import android.view.View;

import com.facebook.react.uimanager.util.ReactFindViewUtil;

import java.util.HashSet;
import java.util.Set;

public interface ViewSpies {

    /**
     * Implementation note: For this purpose, a simpler RN API exists in the same class -
     * {@link ReactFindViewUtil#addViewListener(ReactFindViewUtil.OnViewFoundListener)}.
     * However, it is found to be a bit buggy since it removes all listeners immediately
     * after being called (i.e. while iterating) with no thread-sync mechanisms to protect it.
     * If real life (CI), we've genuinely seen that it throws ConcurrentModificationException exceptions,
     * on occasions (and why wouldn't it? - our demo app's ActionsScreen has multiple views subscribing and
     * called concurrently; could it be that not always everything is run in the main thread?).
     * Therefore, we use here {@link ReactFindViewUtil#addViewsListener(ReactFindViewUtil.OnMultipleViewsFoundListener, Set)},
     * which is too generic but nevertheless allows us to better control when we are to be removed.
     */
    abstract class BaseViewSpy implements ReactFindViewUtil.OnMultipleViewsFoundListener {
        private final String testID;

        private BaseViewSpy(String testID) {
            this.testID = testID;
        }

        public void attach() {
            final Set<String> nativeIds = new HashSet<>();
            nativeIds.add(testID);

            ReactFindViewUtil.addViewsListener(this, nativeIds);
        }

        String getTestID() {
            return testID;
        }

        abstract void handleViewFound(View view);

        @Override
        public void onViewFound(View view, String nativeId) {
            handleViewFound(view);
            view.post(() -> ReactFindViewUtil.removeViewsListener(this));
        }
    }

    class LongTapCrasher extends BaseViewSpy {
        public LongTapCrasher(String testID) {
            super(testID);
        }

        @Override
        protected void handleViewFound(View view) {
            view.setOnLongClickListener(v -> {
                throw new IllegalStateException("Validation failed: component \"" + getTestID() + "\" was long-tapped!!!");
            });
        }
    }
}
