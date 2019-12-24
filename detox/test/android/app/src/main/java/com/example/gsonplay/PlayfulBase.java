package com.example.gsonplay;

public class PlayfulBase {
    Integer id;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public static class PlayfulImpl1 extends PlayfulBase {
        String game;

        public String getGame() {
            return game;
        }

        public void setGame(String game) {
            this.game = game;
        }
    }

    public static class PlayfulImpl2 extends PlayfulBase {
        CheerfulBase cheer;

        public CheerfulBase getCheer() {
            return cheer;
        }

        public void setCheer(CheerfulBase cheer) {
            this.cheer = cheer;
        }
    }
}
