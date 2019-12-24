package com.example.gsonplay;

import com.example.gsonplay.CheerfulBase.CheerfulImpl1;
import com.example.gsonplay.PlayfulBase.PlayfulImpl1;
import com.example.gsonplay.PlayfulBase.PlayfulImpl2;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.typeadapters.RuntimeTypeAdapterFactory;

import org.junit.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * helpful links
 * https://stackoverflow.com/a/52162775/453052
 */
public class PlayfulTest {
    @Test
    public void test() {

        RuntimeTypeAdapterFactory<PlayfulBase> rootTypesFactory = RuntimeTypeAdapterFactory
                .of(PlayfulBase.class, "type")
                .registerSubtype(PlayfulImpl1.class, "impl1");

        Gson gson = new GsonBuilder()
                .registerTypeAdapterFactory(rootTypesFactory)
                .create();

        PlayfulBase uut = gson.fromJson("{\"type\":\"impl1\", \"id\":777, \"game\":\"cards\"}", PlayfulBase.class);
        assertThat(uut).isInstanceOf(PlayfulImpl1.class);
        assertThat(((PlayfulImpl1) uut).getGame()).isEqualTo("cards");
    }

    @Test
    public void test2() {
        RuntimeTypeAdapterFactory<PlayfulBase> rootTypesFactory = RuntimeTypeAdapterFactory
                .of(PlayfulBase.class, "type")
                .registerSubtype(PlayfulImpl1.class, "impl1")
                .registerSubtype(PlayfulImpl2.class, "impl2");

        RuntimeTypeAdapterFactory<CheerfulBase> cheerTypesFactory = RuntimeTypeAdapterFactory
                .of(CheerfulBase.class, "type")
                .registerSubtype(CheerfulImpl1.class, "cimpl1");

        Gson gson = new GsonBuilder()
                .registerTypeAdapterFactory(rootTypesFactory)
                .registerTypeAdapterFactory(cheerTypesFactory)
                .create();

        String cheerJson = "{\"type\":\"cimpl1\", \"cheerId\":9, \"cheer\":\"hooray!\"}";
        String json = "{\"type\":\"impl2\", \"id\":888, \"cheer\":" + cheerJson + "}";
        PlayfulBase uut = gson.fromJson(json, PlayfulBase.class);
        assertThat(uut).isInstanceOf(PlayfulImpl2.class);

        CheerfulBase cheer = ((PlayfulImpl2) uut).getCheer();
        assertThat(cheer).isInstanceOf(CheerfulImpl1.class);
        assertThat(((CheerfulImpl1) cheer).getCheer()).isEqualTo("hooray!");
    }
}
