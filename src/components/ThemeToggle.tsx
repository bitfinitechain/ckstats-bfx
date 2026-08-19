"use client";

import { useTheme } from "next-themes";
import { ThemeToggle as BrandThemeToggle } from "@bitfinitechain/brandkit";

// The button comes from Brandkit; the wiring stays here. Four apps had four of
// these and they had drifted into two different-looking controls — this one and
// its two siblings render the `ghost` variant, analytics the `outline` one to
// match its dense ops chrome.
//
// resolvedTheme, not theme. These apps enable `enableSystem`, so `theme` can
// hold "system", and the old code compared THAT against "light". For anyone
// carrying a stored "system" preference on a light OS the first click set light
// — which it already was — so the button did nothing until the second press.
// resolvedTheme is what is actually on screen, which is what a toggle flips.
export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const theme = resolvedTheme === "light" ? "light" : "dark";

    return (
        <BrandThemeToggle
            theme={theme}
            onToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
            variant="ghost"
        />
    );
}
