package com.sechub.support;

/**
 * Thread-local holder for the current request language.
 * Populated by {@link com.sechub.config.LocaleFilter} on every request
 * and cleared afterwards so the thread can be reused safely.
 *
 * <p>Usage: call {@code LocaleHolder.isEn()} anywhere in service code
 * to decide which language string to return.
 */
public final class LocaleHolder {

    private static final ThreadLocal<String> LANG = new ThreadLocal<>();

    private LocaleHolder() {}

    /** Called by the filter — stores the raw Accept-Language header value. */
    public static void set(String lang) {
        LANG.set(lang);
    }

    /** Returns the raw language string, or {@code null}. */
    public static String get() {
        return LANG.get();
    }

    /** Convenience: returns {@code true} when the client prefers English. */
    public static boolean isEn() {
        String lang = LANG.get();
        return lang != null && lang.toLowerCase().startsWith("en");
    }

    /** Must be called in a {@code finally} block to prevent thread-pool leaks. */
    public static void clear() {
        LANG.remove();
    }
}
