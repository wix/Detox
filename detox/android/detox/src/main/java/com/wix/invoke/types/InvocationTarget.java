package com.wix.invoke.types;

import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.ClassUtils;
import org.apache.commons.lang3.reflect.MethodUtils;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * Created by rotemm on 20/10/2016.
 */
public class InvocationTarget extends Target {

    public InvocationTarget(Invocation value) {
        super(value);
    }

    @Override
    public Object execute(Invocation invocation) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        return  invokeExactMethod(invocation.getTarget().getValue(), invocation.getMethod(), invocation.getArgs());
    }

    public static Object invokeExactMethod(final Object object, final String methodName,
                                           Object... args) throws NoSuchMethodException,
            IllegalAccessException, InvocationTargetException {
        args = ArrayUtils.nullToEmpty(args);
        final Class<?>[] parameterTypes = ClassUtils.toClass(args);
        return invokeExactMethod(object, methodName, args, parameterTypes);
    }

    public static Object invokeExactMethod(final Object object, final String methodName,
                                           Object[] args, Class<?>[] parameterTypes)
            throws NoSuchMethodException, IllegalAccessException,
            InvocationTargetException {
        args = ArrayUtils.nullToEmpty(args);
        parameterTypes = ArrayUtils.nullToEmpty(parameterTypes);
        final Method method = MethodUtils.getMatchingAccessibleMethod(object.getClass(), methodName,
                parameterTypes);
        if (method == null) {
            throw new NoSuchMethodException("No such accessible method: "
                    + methodName + "() on object: "
                    + object.getClass().getName());
        }
        return method.invoke(object, args);
    }
}
