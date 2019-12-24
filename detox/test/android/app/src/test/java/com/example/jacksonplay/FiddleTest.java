package com.example.jacksonplay;

import android.util.JsonReader;

import com.example.jacksonplay.FiddleBase.FiddleImpl1;
import com.example.jacksonplay.FiddleBase.FiddleImpl2;
import com.example.jacksonplay.WiggleBase.WiggleImpl1;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.Test;

import static org.assertj.core.api.Assertions.assertThat;


/**
 * helpful links
 * https://www.tutorialspoint.com/jackson_annotations/jackson_annotations_jsonsubtypes.htm
 * (maybe) https://stackoverflow.com/questions/30060617/is-jsontyperesolver-the-only-option-for-resolving-using-multiple-properties
 */
public class FiddleTest {
    @Test
    public void test1() throws Exception {
        ObjectMapper om = new ObjectMapper();
        FiddleBase uut = om.readValue("{\"type\":\"impl1\",\"id\":667,\"name\":\"Mr. man\"}", FiddleBase.class);
        assertThat(uut).isInstanceOf(FiddleImpl1.class);
        assertThat(((FiddleImpl1) uut).getName()).isEqualTo("Mr. man");
    }

    @Test
    public void test2() throws Exception {
        ObjectMapper om = new ObjectMapper();
        String wiggleJson = "{\"type\":\"wimpl1\", \"seed\":111, \"weed\":\"green\"}";

        FiddleBase uut = om.readValue("{\"type\":\"impl2\",\"id\":666,\"wiggle\": " + wiggleJson + " }", FiddleBase.class);
        assertThat(uut).isInstanceOf(FiddleImpl2.class);

        WiggleBase wiggle = ((FiddleImpl2) uut).getWiggle();
        assertThat(wiggle).isInstanceOf(WiggleImpl1.class);
        assertThat(((WiggleImpl1) wiggle).getWeed()).isEqualTo("brown");
    }

}
