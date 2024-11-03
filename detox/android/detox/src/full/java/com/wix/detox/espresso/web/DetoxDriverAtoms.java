package com.wix.detox.espresso.web;

import static androidx.test.espresso.web.model.Atoms.castOrDie;
import static androidx.test.espresso.web.webdriver.Locator.*;
import static java.util.Collections.emptyList;
import static java.util.Collections.singletonList;
import static java.util.Collections.singletonMap;

import androidx.annotation.VisibleForTesting;
import androidx.test.espresso.remote.annotation.RemoteMsgConstructor;
import androidx.test.espresso.remote.annotation.RemoteMsgField;
import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.model.ElementReference;
import androidx.test.espresso.web.model.Evaluation;
import androidx.test.espresso.web.model.SimpleAtom;
import androidx.test.espresso.web.model.TransformingAtom;
import androidx.test.espresso.web.model.WindowReference;
import androidx.test.espresso.web.webdriver.Locator;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * A collection of Javascript Atoms from the WebDriver project.
 */
public final class DetoxDriverAtoms {

    static Locator forType(String type) {
        if (CLASS_NAME.getType().equals(type)) {
            return CLASS_NAME;
        }
        if (CSS_SELECTOR.getType().equals(type)) {
            return CSS_SELECTOR;
        }
        if (ID.getType().equals(type)) {
            return ID;
        }
        if (LINK_TEXT.getType().equals(type)) {
            return LINK_TEXT;
        }
        if (NAME.getType().equals(type)) {
            return NAME;
        }
        if (PARTIAL_LINK_TEXT.getType().equals(type)) {
            return PARTIAL_LINK_TEXT;
        }
        if (TAG_NAME.getType().equals(type)) {
            return TAG_NAME;
        }
        if (XPATH.getType().equals(type)) {
            return XPATH;
        }
        throw new IllegalStateException("No Locator enum found for a given type: " + type);
    }

    private DetoxDriverAtoms() {
    }

    /**
     * Simulates the javascript events to click on a particular element.
     */
    public static Atom<Evaluation> webClick() {
        return new WebClickSimpleAtom();
    }

    /**
     * Clears content from an editable element.
     */
    public static Atom<Evaluation> clearElement() {
        return new ClearElementSimpleAtom();
    }

    /**
     * Simulates javascript key events sent to a certain element.
     */
    public static Atom<Evaluation> webKeys(final String text) {
        return new WebKeysSimpleAtom(text);
    }

    /**
     * Finds an element using the provided locatorType strategy.
     */
    public static Atom<ElementReference> findElement(final Locator locator, final String value) {
        return new FindElementTransformingAtom(
            new FindElementSimpleAtom(locator.getType(), value), castOrDie(ElementReference.class));
    }

    /**
     * Finds the currently active element in the document.
     */
    public static Atom<ElementReference> selectActiveElement() {
        return new SelectActiveElementTransformingAtom(
            new ActiveElementSimpleAtom(), castOrDie(ElementReference.class));
    }

    /**
     * Selects a subframe of the currently selected window by it's index.
     */
    public static Atom<WindowReference> selectFrameByIndex(int index) {
        return new SelectFrameByIndexTransformingAtom(
            new FrameByIndexSimpleAtom(index), castOrDie(WindowReference.class));
    }

    /**
     * Selects a subframe of the given window by it's index.
     */
    public static Atom<WindowReference> selectFrameByIndex(int index, WindowReference root) {
        return new SelectFrameByIndexTransformingAtom(
            new FrameByIndexWithRootSimpleAtom(index, root),
            castOrDie(WindowReference.class));
    }

    /**
     * Selects a subframe of the given window by it's name or id.
     */
    public static Atom<WindowReference> selectFrameByIdOrName(String idOrName, WindowReference root) {
        return new SelectFrameByIdOrNameTransformingAtom(
            new FrameByIdOrNameWithRootSimpleAtom(idOrName, root),
            castOrDie(WindowReference.class));
    }

    /**
     * Selects a subframe of the current window by it's name or id.
     */
    public static Atom<WindowReference> selectFrameByIdOrName(String idOrName) {
        return new SelectFrameByIdOrNameTransformingAtom(
            new FrameByIdOrNameSimpleAtom(idOrName), castOrDie(WindowReference.class));
    }

    /**
     * Returns the visible text beneath a given DOM element.
     */
    public static Atom<String> getText() {
        return new GetTextTransformingAtom(new GetVisibleTextSimpleAtom(), castOrDie(String.class));
    }

    /**
     * Returns {@code true} if the desired element is in view after scrolling.
     */
    public static Atom<Boolean> webScrollIntoView() {
        return new WebScrollIntoViewAtom(new WebScrollIntoViewSimpleAtom(), castOrDie(Boolean.class));
    }

    /**
     * Finds multiple elements given a locator strategy.
     */
    public static Atom<List<ElementReference>> findMultipleElementsDetox(
        final Locator locator, final String value) {

        SimpleAtom findElementsScriptSimpleAtom =
            new FindElementsScriptSimpleAtom(locator.getType(), value);
        TransformingAtom.Transformer<Evaluation, List<ElementReference>> elementReferenceListAtom =
            new ElementReferenceListAtom(locator.getType(), value);

        return new FindMultipleElementsTransformingAtom(
            findElementsScriptSimpleAtom, elementReferenceListAtom);
    }

    private static Map<String, String> makeLocatorJSON(Locator locator, String value) {
        Map<String, String> map = new  HashMap<String, String>();
        map.put(locator.getType(), value);
        map.put("selector", getSelector(locator, value));
        return map;
    }

    private static String getSelector(Locator type, String value) {
        return switch (type) {
            case ID -> "#" + value;
            case CLASS_NAME -> "." + value;
            case LINK_TEXT -> "a[href=\"" + value + "\"]";
            case PARTIAL_LINK_TEXT -> "a[href*=\"" + value + "\"]";
            case CSS_SELECTOR -> value;
            case NAME -> "[name=\"" + value + "\"]";
            case TAG_NAME -> value;
            case XPATH -> throw new IllegalArgumentException("XPath should be handled separately");
            default -> throw new IllegalArgumentException("Unknown Locator type: " + type);
        };
    }

    @VisibleForTesting
    static final class FindElementSimpleAtom extends SimpleAtom {
        @RemoteMsgField(order = 0)
        final String locatorType;

        @RemoteMsgField(order = 1)
        final String value;

        @RemoteMsgConstructor
        FindElementSimpleAtom(String locatorType, String value) {
            super("", SimpleAtom.ElementReferencePlacement.LAST);
            this.locatorType = locatorType;
            this.value = value;
        }

        @Override
        protected List<Object> getNonContextualArguments() {
            final Map<String, String> locatorJson = makeLocatorJSON(forType(locatorType), value);
            return singletonList(locatorJson);
        }
    }

    @VisibleForTesting
    static final class FindElementTransformingAtom
        extends TransformingAtom<Evaluation, ElementReference> {
        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 0)
        private final Atom<Evaluation> findElementSimpleAtom;

        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 1)
        private final TransformingAtom.Transformer<Evaluation, ElementReference> castOrDieAtom;

        @RemoteMsgConstructor
        private FindElementTransformingAtom(
            Atom<Evaluation> findElementSimpleAtom,
            TransformingAtom.Transformer<Evaluation, ElementReference> castOrDieAtom) {
            super(findElementSimpleAtom, castOrDieAtom);
            this.findElementSimpleAtom = findElementSimpleAtom;
            this.castOrDieAtom = castOrDieAtom;
        }
    }

    @VisibleForTesting
    static final class ClearElementSimpleAtom extends SimpleAtom {
        @RemoteMsgConstructor
        private ClearElementSimpleAtom() {
            super("");
        }

        @Override
        public void handleNoElementReference() {
            throw new RuntimeException("clearElement: Need an element to clear!");
        }
    }

    @VisibleForTesting
    static final class WebKeysSimpleAtom extends SimpleAtom {
        @RemoteMsgField(order = 0)
        private final String text;

        @RemoteMsgConstructor
        private WebKeysSimpleAtom(String text) {
            super("");
            this.text = text;
        }

        @Override
        public void handleNoElementReference() {
            throw new RuntimeException("webKeys: Need an element to type on!");
        }

        @Override
        public List<Object> getNonContextualArguments() {
            return singletonList(text);
        }
    }

    @VisibleForTesting
    static final class WebScrollIntoViewAtom extends TransformingAtom<Evaluation, Boolean> {
        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 0)
        private final Atom<Evaluation> scrollIntoViewSimpleAtom;

        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 1)
        private final TransformingAtom.Transformer<Evaluation, Boolean> castOrDieAtom;

        @RemoteMsgConstructor
        private WebScrollIntoViewAtom(
            Atom<Evaluation> scrollIntoViewSimpleAtom,
            TransformingAtom.Transformer<Evaluation, Boolean> castOrDieAtom) {
            super(scrollIntoViewSimpleAtom, castOrDieAtom);
            this.scrollIntoViewSimpleAtom = scrollIntoViewSimpleAtom;
            this.castOrDieAtom = castOrDieAtom;
        }
    }

    static final class WebScrollIntoViewSimpleAtom extends SimpleAtom {
        @RemoteMsgConstructor
        private WebScrollIntoViewSimpleAtom() {
            super("");
        }

        @Override
        public void handleNoElementReference() {
            throw new RuntimeException("scrollIntoView: need an element to scroll to");
        }
    }

    @VisibleForTesting
    static final class WebClickSimpleAtom extends SimpleAtom {
        @RemoteMsgConstructor
        private WebClickSimpleAtom() {
            super("");
        }

        @Override
        public void handleNoElementReference() {
            throw new RuntimeException("webClick: Need an element to click on!");
        }
    }

    @VisibleForTesting
    static final class GetTextTransformingAtom extends TransformingAtom<Evaluation, String> {
        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 0)
        private final Atom<Evaluation> getTextSimpleAtom;

        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 1)
        private final TransformingAtom.Transformer<Evaluation, String> castOrDieAtom;

        @RemoteMsgConstructor
        private GetTextTransformingAtom(
            Atom<Evaluation> findElementSimpleAtom,
            TransformingAtom.Transformer<Evaluation, String> castOrDieAtom) {
            super(findElementSimpleAtom, castOrDieAtom);
            this.getTextSimpleAtom = findElementSimpleAtom;
            this.castOrDieAtom = castOrDieAtom;
        }
    }

    @VisibleForTesting
    static final class GetVisibleTextSimpleAtom extends SimpleAtom {
        @RemoteMsgConstructor
        private GetVisibleTextSimpleAtom() {
            super("");
        }
    }

    @VisibleForTesting
    static final class ActiveElementSimpleAtom extends SimpleAtom {
        @RemoteMsgConstructor
        private ActiveElementSimpleAtom() {
            super("");
        }
    }

    @VisibleForTesting
    static final class SelectActiveElementTransformingAtom
        extends TransformingAtom<Evaluation, ElementReference> {
        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 0)
        private final Atom<Evaluation> selectActiveElementSimpleAtom;

        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 1)
        private final TransformingAtom.Transformer<Evaluation, ElementReference> castOrDieAtom;

        @RemoteMsgConstructor
        private SelectActiveElementTransformingAtom(
            Atom<Evaluation> selectActiveElementSimpleAtom,
            TransformingAtom.Transformer<Evaluation, ElementReference> castOrDieAtom) {
            super(selectActiveElementSimpleAtom, castOrDieAtom);
            this.selectActiveElementSimpleAtom = selectActiveElementSimpleAtom;
            this.castOrDieAtom = castOrDieAtom;
        }
    }

    @VisibleForTesting
    static final class FrameByIndexSimpleAtom extends SimpleAtom {
        @RemoteMsgField(order = 0)
        private final int index;

        @RemoteMsgConstructor
        private FrameByIndexSimpleAtom(int index) {
            super("");
            this.index = index;
        }

        @Override
        public List<Object> getNonContextualArguments() {
            return singletonList(index);
        }
    }

    @VisibleForTesting
    static final class FrameByIndexWithRootSimpleAtom extends SimpleAtom {
        @RemoteMsgField(order = 0)
        private final int index;

        @RemoteMsgField(order = 1)
        private final WindowReference root;

        @RemoteMsgConstructor
        private FrameByIndexWithRootSimpleAtom(int index, WindowReference root) {
            super("");
            this.index = index;
            this.root = root;
        }

        @Override
        public List<Object> getNonContextualArguments() {
            return Arrays.asList(index, root);
        }
    }

    @VisibleForTesting
    static final class SelectFrameByIndexTransformingAtom
        extends TransformingAtom<Evaluation, WindowReference> {
        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 0)
        private final Atom<Evaluation> frameByIndexSimpleAtom;

        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 1)
        private final TransformingAtom.Transformer<Evaluation, WindowReference> castOrDieAtom;

        @RemoteMsgConstructor
        private SelectFrameByIndexTransformingAtom(
            Atom<Evaluation> selectActiveElementSimpleAtom,
            TransformingAtom.Transformer<Evaluation, WindowReference> castOrDieAtom) {
            super(selectActiveElementSimpleAtom, castOrDieAtom);
            this.frameByIndexSimpleAtom = selectActiveElementSimpleAtom;
            this.castOrDieAtom = castOrDieAtom;
        }
    }

    @VisibleForTesting
    static final class FrameByIdOrNameSimpleAtom extends SimpleAtom {
        @RemoteMsgField(order = 0)
        private final String idOrName;

        @RemoteMsgConstructor
        private FrameByIdOrNameSimpleAtom(String idOrName) {
            super("");
            this.idOrName = idOrName;
        }

        @Override
        public List<Object> getNonContextualArguments() {
            return singletonList(idOrName);
        }
    }

    @VisibleForTesting
    static final class FrameByIdOrNameWithRootSimpleAtom extends SimpleAtom {
        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 0)
        private final String idOrName;

        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 1)
        private final WindowReference root;

        @RemoteMsgConstructor
        private FrameByIdOrNameWithRootSimpleAtom(String idOrName, WindowReference root) {
            super("");
            this.idOrName = idOrName;
            this.root = root;
        }

        @Override
        public List<Object> getNonContextualArguments() {
            return Arrays.asList(idOrName, root);
        }
    }

    @VisibleForTesting
    static final class SelectFrameByIdOrNameTransformingAtom
        extends TransformingAtom<Evaluation, WindowReference> {
        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 0)
        private final Atom<Evaluation> frameByIndexOrNameSimpleAtom;

        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 1)
        private final TransformingAtom.Transformer<Evaluation, WindowReference> castOrDieAtom;

        @RemoteMsgConstructor
        private SelectFrameByIdOrNameTransformingAtom(
            Atom<Evaluation> selectActiveElementSimpleAtom,
            TransformingAtom.Transformer<Evaluation, WindowReference> castOrDieAtom) {
            super(selectActiveElementSimpleAtom, castOrDieAtom);
            this.frameByIndexOrNameSimpleAtom = selectActiveElementSimpleAtom;
            this.castOrDieAtom = castOrDieAtom;
        }
    }

//    static String jsFunction =
//        "const findElementsInWebView = function (args) {\n" +
//            "console.log('findElementsInWebView' + JSON.stringify(args));" +
//            "  if (!args || typeof args !== 'object') {\n" +
//            "    throw new Error(\"Invalid arguments. Expected an object with selector type keys.\");\n" +
//            "  }\n" +
//            "\n" +
//            "  // Check if a specific key is provided in the arguments and use the appropriate selector\n" +
//            "  if (args.className) {\n" +
//            "    return Array.from(document.getElementsByClassName(args.className));\n" +
//            "  } else if (args.id) {\n" +
//            "    const element = document.getElementById(args.id);\n" +
//            "    return element ? [element] : [];\n" +
//            "  } else if (args.tagName) {\n" +
//            "    return Array.from(document.getElementsByTagName(args.tagName));\n" +
//            "  } else if (args.xpath) {\n" +
//            "    const result = [];\n" +
//            "    const nodesSnapshot = document.evaluate(args.xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);\n" +
//            "    for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {\n" +
//            "      result.push(nodesSnapshot.snapshotItem(i));\n" +
//            "    }\n" +
//            "    return result;\n" +
//            "  } else {\n" +
//            "    throw new Error(\"Unsupported selector type. Expected one of: className, id, tagName, xpath.\");\n" +
//            "  }\n" +
//            "};" +
//            "console.time('findElementsInWebView');" +
//            "var result = findElementsInWebView(arguments[0]);" +
//            "console.timeEnd('findElementsInWebView');" +
//            "return result;";

    static String jsFunction =
            "console.log('getAllElements:' + arguments[0]);" +
            "\tvar getAllElements = function(doc, selector) {\n" +
            "\t\tvar elements = Array.from(doc.querySelectorAll(selector));\n" +
            "\t\tvar frames = doc.querySelectorAll('iframe');\n" +
            "\t\tfor (var i = 0; i < frames.length; i++) {\n" +
            "\t\t\ttry {\n" +
            "\t\t\t\tvar frameDoc = frames[i].contentDocument || frames[i].contentWindow.document;\n" +
            "\t\t\t\tvar frameElements = getAllElements(frameDoc, selector);\n" +
            "\t\t\t\telements = elements.concat(frameElements);\n" +
            "\t\t\t} catch(e) {\n" +
            "\t\t\t\t/* Probably issues accessing iframe documents (CORS restrictions) */\n" +
            "\t\t\t}\n" +
            "\t\t}\n" +
            "\n" +
            "\t\treturn elements;\n" +
            "\t};\n" +
            "console.time('findElementsInWebView');" +
            "\tvar allElements = getAllElements(document, arguments[0].selector);\n" +
            "console.timeEnd('findElementsInWebView');" +
            "\treturn allElements;";


    @VisibleForTesting
    static final class FindElementsScriptSimpleAtom extends SimpleAtom {
        @RemoteMsgField(order = 0)
        final String locatorType;

        @RemoteMsgField(order = 1)
        final String value;

        @RemoteMsgConstructor
        private FindElementsScriptSimpleAtom(String locatorType, String value) {
            super(jsFunction);
            this.locatorType = locatorType;
            this.value = value;
        }

        @Override
        public List<Object> getNonContextualArguments() {
            return singletonList(makeLocatorJSON(forType(locatorType), value));
        }
    }

    @VisibleForTesting
    static final class FindMultipleElementsTransformingAtom
        extends TransformingAtom<Evaluation, List<ElementReference>> {
        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 0)
        private final Atom<Evaluation> findElementsScriptSimpleAtom;

        @SuppressWarnings("unused") // called reflectively
        @RemoteMsgField(order = 1)
        private final TransformingAtom.Transformer<Evaluation, List<ElementReference>>
            elementReferenceListAtom;

        @RemoteMsgConstructor
        private FindMultipleElementsTransformingAtom(
            Atom<Evaluation> findElementsScriptSimpleAtom,
            TransformingAtom.Transformer<Evaluation, List<ElementReference>> elementReferenceListAtom) {
            super(findElementsScriptSimpleAtom, elementReferenceListAtom);
            this.findElementsScriptSimpleAtom = findElementsScriptSimpleAtom;
            this.elementReferenceListAtom = elementReferenceListAtom;
        }
    }

    static final class ElementReferenceListAtom
        implements TransformingAtom.Transformer<Evaluation, List<ElementReference>> {

        @RemoteMsgField(order = 0)
        final String locatorType;

        @RemoteMsgField(order = 1)
        final String value;

        @RemoteMsgConstructor
        private ElementReferenceListAtom(String locatorType, String value) {
            this.locatorType = locatorType;
            this.value = value;
        }

        @Override
        public List<ElementReference> apply(Evaluation e) {
            Object rawValues = e.getValue();
            if (null == rawValues) {
                return emptyList();
            }
            if (rawValues instanceof Iterable) {
                List<ElementReference> references = new ArrayList<>();
                for (Object rawValue : ((Iterable) rawValues)) {
                    if (rawValue instanceof ElementReference) {
                        references.add((ElementReference) rawValue);
                    } else {
                        throw new RuntimeException(
                            String.format(
                                "Unexpected non-elementReference in findMultipleElements(%s, %s): "
                                    + "(%s) all: %s ",
                                forType(locatorType).name(), value, rawValue, e));
                    }
                }
                return references;
            } else {
                throw new RuntimeException(
                    String.format(
                        "Unexpected non-iterableType in findMultipleElements(%s, %s): "
                            + "return evaluation: %s ",
                        forType(locatorType).name(), value, e));
            }
        }
    }
}
