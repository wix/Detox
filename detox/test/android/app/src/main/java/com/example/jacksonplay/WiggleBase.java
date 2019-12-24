package com.example.jacksonplay;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonTypeInfo(use=JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({@JsonSubTypes.Type(WiggleBase.WiggleImpl1.class)})
public class WiggleBase {
    Integer seed;

    public Integer getSeed() {
        return seed;
    }

    public void setSeed(Integer seed) {
        this.seed = seed;
    }

    @JsonTypeName("wimpl1")
    public static class WiggleImpl1 extends WiggleBase {
        String weed;

        public String getWeed() {
            return weed;
        }

        public void setWeed(String weed) {
            this.weed = weed;
        }
    }
}
