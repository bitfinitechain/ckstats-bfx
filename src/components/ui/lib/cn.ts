// GENERATED — do not edit here.
// Canonical: Brandkit/ui/lib/cn.ts   ·   update there, then: bash skills/sync.sh
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// The package's OWN class merger.
//
// Components here used to `import { cn } from '@/lib/utils'`. That works while
// they are copied INTO an app, because `@` is the app's alias — and breaks the
// moment the same file is installed under node_modules, where `@` means nothing.
// A shared component cannot depend on a path only its consumer defines.
//
// So this is deliberately a duplicate of each app's lib/utils.ts rather than an
// import of it. The two must stay behaviourally identical, which is why both are
// the same three lines with no options: clsx flattens conditionals, twMerge
// resolves Tailwind conflicts by keeping the last of a competing pair, so a
// caller's `px-6` beats a variant's `px-4` instead of the two fighting on
// specificity.
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
