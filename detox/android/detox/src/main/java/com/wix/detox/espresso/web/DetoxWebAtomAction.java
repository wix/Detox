package com.wix.detox.espresso.web;

import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.model.Atoms;
import androidx.test.espresso.web.model.Evaluation;
import androidx.test.espresso.web.webdriver.DriverAtoms;

import java.util.ArrayList;

public class DetoxWebAtomAction {

    private DetoxWebAtomAction() {
        // static class
    }

    public static Atom<Evaluation> click() {
        return DriverAtoms.webClick();
    }

    public static Atom<Evaluation> typeText(String text) {
        return DriverAtoms.webKeys(text);
    }

    public static Atom<Evaluation> replaceText(String text) {
        clearText();
        return DriverAtoms.webKeys(text);
    }

    public static Atom<Evaluation> clearText() {
        return DriverAtoms.clearElement();
    }

    public static Atom<Boolean> scrollToView() {
        return DriverAtoms.webScrollIntoView();
    }

    public static Atom<String> getText() {
        return DriverAtoms.getText();
    }

    public static Atom<Evaluation> runScript(String script) {
        return Atoms.script(script);
    }

    public static Atom<Evaluation> runScriptWithArgs(String script, final ArrayList<Object> args) {
        return Atoms.scriptWithArgs(script, args);
    }

    public static Atom<String> getCurrentUrl() {
        return Atoms.getCurrentUrl();
    }

    public static Atom<String> getTitle() {
        return Atoms.getTitle();
    }
}
