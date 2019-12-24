package com.example.jacksonplay;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonTypeInfo(use=JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({@JsonSubTypes.Type(FiddleBase.FiddleImpl1.class), @JsonSubTypes.Type(FiddleBase.FiddleImpl2.class)})
public class FiddleBase {
    Integer id;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    @JsonTypeName("impl1")
    public static class FiddleImpl1 extends FiddleBase {
        String name;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }

    @JsonTypeName("impl2")
    public static class FiddleImpl2 extends FiddleBase {
        WiggleBase wiggle;

        public WiggleBase getWiggle() {
            return wiggle;
        }

        public void setWiggle(WiggleBase wiggle) {
            this.wiggle = wiggle;
        }
    }
}
