package com.wix.invoke;

import com.wix.invoke.exceptions.EmptyInvocationInstructionException;
import com.wix.invoke.parser.JsonParser;
import com.wix.invoke.types.Invocation;
import com.wix.invoke.types.Target;

import org.apache.commons.lang3.StringUtils;

import java.lang.reflect.InvocationTargetException;


/**
 * Created by rotemm on 10/10/2016.
 */
public class MethodInvocation {

    public static Object invoke(Object map) throws ClassNotFoundException, NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        return invoke(map, null);
    }

    public static Object invoke(Object map, Class<?> extendWith) throws ClassNotFoundException, NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        JsonParser parser = getParserWithExtendedParsableTargetTypes(extendWith);
        Invocation invocation = parser.parse(map, Invocation.class);
        return invoke(invocation);
    }

    public static Object invoke(String invocationJson) throws ClassNotFoundException, NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        return invoke(invocationJson, null);
    }

    public static Object invoke(String invocationJson, Class<?> extendWith) throws ClassNotFoundException, NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        JsonParser parser = getParserWithExtendedParsableTargetTypes(extendWith);
        Invocation invocation = parser.parse(invocationJson, Invocation.class);
        return invoke(invocation);
    }

    public static Object invoke(Invocation invocation) throws ClassNotFoundException, NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        if (StringUtils.isBlank(invocation.getMethod()))
            throw new EmptyInvocationInstructionException();

        try {
            Target target = invocation.getTarget();
            return target.invoke(invocation);
        } catch (Exception e) {
            throw e;
        }
    }

    public static JsonParser getParserWithExtendedParsableTargetTypes(Class<?> extendWith) {
        JsonParser parser = new JsonParser();
        parser.addMixInAnnotations(Target.class, extendWith);
        return parser;
    }
}
