package com.capriza.approvalsapp.detox;

import android.content.ComponentName;
import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Intent intent = getIntent();
        String server = intent.getStringExtra("detoxServer");
        String session = intent.getStringExtra("detoxSessionId");
        String packageName = intent.getStringExtra("packageName");

        StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.append("server: ");
        stringBuilder.append(server);
        stringBuilder.append("; session: ");
        stringBuilder.append(session);
        stringBuilder.append("; packageName: ");
        stringBuilder.append(packageName);

        ComponentName cn = new ComponentName(packageName, "android.support.test.runner.AndroidJUnitRunner");
        Bundle bn = new Bundle();
        bn.putString("detoxServer", server);
        bn.putString("detoxSessionId", session);
        startInstrumentation(cn, null, bn);
    }
}
