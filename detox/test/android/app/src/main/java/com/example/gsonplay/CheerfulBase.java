package com.example.gsonplay;

public class CheerfulBase {
    Integer cheerId;

    public Integer getCheerId() {
        return cheerId;
    }

    public void setCheerId(Integer cheerId) {
        this.cheerId = cheerId;
    }

    public static class CheerfulImpl1 extends CheerfulBase {
        String cheer;

        public String getCheer() {
            return cheer;
        }

        public void setCheer(String cheer) {
            this.cheer = cheer;
        }
    }
}
