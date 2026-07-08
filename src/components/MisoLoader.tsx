"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import misoLight from "@/lottie/miso-loading.json";
import misoDark from "@/lottie/miso-loading-dark.json";

// lottie-web touches the DOM, so keep the player fully client-side.
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

/**
 * Miso the Cat loading animation — the brand loader that replaces the legacy
 * CSS spinner. Picks the light or dark artwork from the resolved theme so it
 * reads correctly on both backgrounds. Reserves its box size before mount to
 * avoid layout shift (and to stay SSR/hydration-safe with next-themes).
 */
export default function MisoLoader({
    size = 96,
    className = "",
}: {
    size?: number;
    className?: string;
}) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const animationData = resolvedTheme === "dark" ? misoDark : misoLight;

    return (
        <div
            className={className}
            style={{ width: size, height: size }}
            role="status"
            aria-label="Loading"
        >
            {mounted && (
                <Lottie
                    animationData={animationData}
                    loop
                    autoplay
                    style={{ width: size, height: size }}
                />
            )}
            <span className="sr-only">Loading…</span>
        </div>
    );
}
