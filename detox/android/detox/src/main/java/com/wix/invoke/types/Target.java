package com.wix.invoke.types;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.lang.reflect.InvocationTargetException;

/**
 * Created by rotemm on 10/10/2016.
 */

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = ClassTarget.class, name = "Class"),
        @JsonSubTypes.Type(value = InvocationTarget.class, name = "Invocation"),
        @JsonSubTypes.Type(value = ObjectInstanceTarget.class, name = "Espresso"),
})
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class Target {

    Object value;

    public Target(Object value) {
        this.value = value;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public Object invoke(Invocation invocation) throws ClassNotFoundException, NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        if (this.value instanceof Invocation) {
            Invocation innerInvocation = (Invocation) this.value;
            this.value = innerInvocation.getTarget().invoke(innerInvocation);
        }

        Object[] args = invocation.getArgs();
        for (int i = 0; i < args.length; i++) {
            if (args[i] instanceof Invocation) {
                Invocation innerInvocation = (Invocation) args[i];
                args[i] = innerInvocation.getTarget().invoke(innerInvocation);
            }
        }
        invocation.setArgs(args);
        return execute(invocation);
    }

    public abstract Object execute(Invocation invocation) throws ClassNotFoundException, NoSuchMethodException, IllegalAccessException, InvocationTargetException;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Target)) return false;

        Target target = (Target) o;

        return value != null ? value.equals(target.value) : target.value == null;
    }

    @Override
    public int hashCode() {
        int result = (value != null ? value.hashCode() : 0);
        return result;
    }
}