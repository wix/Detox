package com.wix.invoke;

import com.wix.invoke.parser.JsonParser;
import com.wix.invoke.types.ClassTarget;
import com.wix.invoke.types.Invocation;
import com.wix.invoke.types.InvocationTarget;

import org.junit.Test;

import static org.assertj.core.api.Java6Assertions.assertThat;

/**
 * Created by rotemm on 13/10/2016.
 */
public class JsonParserTest {

    @Test
    public void targetClassStaticMethodNoParams() {
        Invocation invocation = new Invocation(new ClassTarget("java.lang.System"), "lineSeparator");
        assertThat(parse("targetClassStaticMethodNoParams.json")).isEqualToComparingFieldByFieldRecursively(invocation);
    }

    @Test
    public void parseTargetClassStaticMethodOneParam() {
        Invocation invocation = new Invocation(new ClassTarget("java.lang.String"), "valueOf", 1.0f);
        assertThat(parse("targetClassStaticMethodOneParam.json")).isEqualToComparingFieldByFieldRecursively(invocation);
    }

    @Test
    public void targetInvocationMethodOfClassStaticMethodOneParam() {
        Invocation innerInvocation = new Invocation(new ClassTarget("java.lang.String"), "valueOf", 1.0f);
        Invocation outerInvocation = new Invocation(new InvocationTarget(innerInvocation), "length");
        assertThat(parse("targetInvocationMethodOfClassStaticMethodOneParam.json")).isEqualToComparingFieldByFieldRecursively(outerInvocation);
    }

    public Invocation parse(String filePath) {
        String jsonData = TestUtils.jsonFileToString(filePath);
        return new JsonParser().parse(jsonData, Invocation.class);
    }
}