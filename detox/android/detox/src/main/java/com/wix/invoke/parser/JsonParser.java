package com.wix.invoke.parser;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;

/**
 * Created by rotemm on 13/10/2016.
 */
public class JsonParser {

    ObjectMapper objectMapper;
    public JsonParser() {
        objectMapper = new ObjectMapper();
    }

    public void addMixInAnnotations(Class<?> target, Class<?> mixinSource) {
        objectMapper.addMixInAnnotations(target, mixinSource);
    }

    public <T> T parse(Object object, Class<T> valueType) {

        try {
            return objectMapper.convertValue(object, valueType);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(e);
        }
    }

    public <T> T parse(String jsonData, Class<T> valueType) {
        try {
            return objectMapper.readValue(jsonData, valueType);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
