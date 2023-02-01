package com.wix.detox.reactnative.idlingresources;

import android.util.Log;
import android.view.Choreographer;

import com.facebook.react.bridge.ReactContext;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import okhttp3.Call;
import okhttp3.Dispatcher;


/**
 * Created by simonracz on 09/10/2017.
 *
 * Idling Resource which monitors React Native's OkHttpClient.
 * <p>
 * Must call stop() on it, before removing it from Espresso.
 */
public class NetworkIdlingResource extends DetoxBaseIdlingResource implements Choreographer.FrameCallback {

    private static final String LOG_TAG = "Detox";

    private ResourceCallback callback;
    private Dispatcher dispatcher;
    private final Set<String> busyResources = new HashSet<>();

    private static final ArrayList<Pattern> blacklist = new ArrayList<>();

    /**
     * Must be called on the UI thread.
     *
     * @param urls list of regexes of blacklisted urls
     */
    public static void setURLBlacklist(List<String> urls) {
        blacklist.clear();
        if (urls == null) return;

        for (String url : urls) {
            try {
                blacklist.add(Pattern.compile(url));
            } catch (PatternSyntaxException e) {
                Log.e(LOG_TAG, "Couldn't parse regular expression for Black list url: " + url, e);
            }
        }
    }

    public NetworkIdlingResource(@NonNull ReactContext reactContext) {
        this(new NetworkingModuleReflected(reactContext).getHttpClient().dispatcher());
    }

    public NetworkIdlingResource(@NonNull Dispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @Override
    public String getName() {
        return NetworkIdlingResource.class.getName();
    }

    @NonNull
    @Override
    public String getDebugName() {
        return "network";
    }

    @Nullable
    @Override
    public synchronized Map<String, Object> getBusyHint() {
        return new HashMap<String, Object>() {{
            put("urls", new ArrayList<>(busyResources));
        }};
    }

    @Override
    public void registerIdleTransitionCallback(ResourceCallback callback) {
        this.callback = callback;
        Choreographer.getInstance().postFrameCallback(this);
    }

    @Override
    public void doFrame(long frameTimeNanos) {
        isIdleNow();
    }

    @Override
    protected synchronized boolean checkIdle() {
        busyResources.clear();

        List<Call> calls = dispatcher.runningCalls();
        for (Call call: calls) {
            final String url = call.request().url().toString();

            if (!isUrlBlacklisted(url)) {
                busyResources.add(url);
            }
        }

        if (!busyResources.isEmpty()) {
            Log.i(LOG_TAG, "Network is busy, with " + busyResources.size() + " in-flight calls");
            Choreographer.getInstance().postFrameCallback(this);
            return false;
        }

        notifyIdle();
        return true;
    }

    @Override
    protected void notifyIdle() {
        if (callback != null) {
            callback.onTransitionToIdle();
        }
    }

    private boolean isUrlBlacklisted(String url) {
        for (Pattern pattern: blacklist) {
            if (pattern.matcher(url).matches()) {
                return true;
            }
        }
        return false;
    }
}
