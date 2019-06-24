package com.wix.detox.espresso.matcher;

import org.hamcrest.BaseMatcher;
import org.hamcrest.Description;
import org.hamcrest.internal.ReflectiveTypeFinder;

/**
 * Identical to Espresso's {@link org.hamcrest.TypeSafeMatcher}, but allows nulls (in which case
 * the "item" is passed-in into the sub-class nonetheless, as a null).
 */
public abstract class NullableTypeSafeMatcher<T> extends BaseMatcher<T> {
    private static final ReflectiveTypeFinder TYPE_FINDER = new ReflectiveTypeFinder("matchesSafely", 1, 0);

    final private Class<?> expectedType;

    protected NullableTypeSafeMatcher() {
        this(TYPE_FINDER);
    }

    protected NullableTypeSafeMatcher(Class<?> expectedType) {
        this.expectedType = expectedType;
    }

    private NullableTypeSafeMatcher(ReflectiveTypeFinder typeFinder) {
      this.expectedType = typeFinder.findExpectedType(getClass());
    }

    /**
     * Subclasses should implement this. The item will already have been checked for
     * the specific type and will never be null.
     */
    abstract boolean matchesSafely(T item);

    /**
     * Subclasses should override this. The item will already have been checked for
     * the specific type and will never be null.
     */
    void describeMismatchSafely(T item, Description mismatchDescription) {
        super.describeMismatch(item, mismatchDescription);
    }

    @Override
    @SuppressWarnings({"unchecked"})
    public final boolean matches(Object item) {
        return (item == null || expectedType.isInstance(item)) && matchesSafely((T) item);
    }

    @SuppressWarnings("unchecked")
    @Override
    final public void describeMismatch(Object item, Description description) {
        if (!expectedType.isInstance(item)) {
            description.appendText("was a ")
                       .appendText(item.getClass().getName())
                       .appendText(" (")
                       .appendValue(item)
                       .appendText(")");
        } else {
            describeMismatchSafely((T) item, description);
        }
    }
}
