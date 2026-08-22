#!/usr/bin/env bash
# Ratchet on shadcn adoption. Fails if the hand-rolled counts go UP.
#
# WHY A RATCHET AND NOT A BAN. There are ~750 inline style blocks and 70
# hand-written <button>s in components/ops. A rule that forbids them outright
# fails on day one and gets disabled; a rule that forbids ADDING them converts
# the backlog into something that can only shrink. The baselines below are the
# real counts at the time of writing — lower them as files are converted, never
# raise them.
#
# The point of the exercise is one styling system, not zero inline styles: a
# one-off `style={{ width: pct + '%' }}` for a computed bar width is correct and
# has no class equivalent. What this catches is a NEW hand-rolled button, input
# or card when the component already exists.
set -uo pipefail
cd "$(dirname "$0")/.."
shopt -s globstar nullglob

# --- baselines: measured 2026-08-22. Only ever go down. ---
# NB the style count uses the same grep the check runs. An earlier draft seeded it
# from `grep "style={{[^}]*}}"`, which only matches blocks that fit on one line and
# undercounted by 61. The ratchet caught it on first run, which is the argument for
# having one.
MAX_BUTTONS=2
MAX_INPUTS=1
# `style={` and not `style={{`. The first draft counted only object literals,
# which meant the main conversion technique — replacing `style={btn(true)}` with
# `className={btnCls(true)}` — was invisible to it: pass 2 moved 50 call sites and
# the number went down by 4. Count every style prop, however it is supplied.
MAX_STYLES=7
# Local `React.CSSProperties` consts are the thing actually being eliminated: each
# one is a private styling system that shadcn already has a name for.
MAX_STYLE_CONSTS=0

fail=0
note() { printf '  %-34s %4s  (max %s)%s\n' "$1" "$2" "$3" "$4"; }

btn=$(grep -rho "<button" src/components/**/*.tsx 2>/dev/null | wc -l)
inp=$(grep -rho "<input\|<select" src/components/**/*.tsx 2>/dev/null | wc -l)
sty=$(grep -rho "style={" src/components/**/*.tsx 2>/dev/null | wc -l)
cst=$(grep -rho "React.CSSProperties" src/components/**/*.tsx 2>/dev/null | wc -l)

echo "shadcn adoption ratchet"
for row in "hand-rolled <button>:$btn:$MAX_BUTTONS" \
           "hand-rolled <input>/<select>:$inp:$MAX_INPUTS" \
           "style={ } props (any form):$sty:$MAX_STYLES" \
           "local CSSProperties consts:$cst:$MAX_STYLE_CONSTS"; do
  name=${row%%:*}; rest=${row#*:}; cur=${rest%%:*}; max=${rest#*:}
  if [ "$cur" -gt "$max" ]; then note "$name" "$cur" "$max" "  ✗ WENT UP"; fail=1
  elif [ "$cur" -lt "$max" ]; then note "$name" "$cur" "$max" "  ↓ lower the baseline"
  else note "$name" "$cur" "$max" ""
  fi
done

# Components that exist but are being bypassed. Zero adoption of a component we
# already ship is the specific failure this whole pass is about: button.tsx sat
# unused while 70 hand-written buttons accumulated around it.
echo "component adoption"
for c in button badge card input collapsible expandable-card; do
  [ -f "src/components/ui/$c.tsx" ] || { printf '  %-22s (not added yet)\n' "$c"; continue; }
  n=$(grep -rl "@/components/ui/$c" src 2>/dev/null | grep -v node_modules | wc -l)
  printf '  %-22s imported by %s file(s)%s\n' "$c" "$n" "$([ "$n" = 0 ] && echo '   ← shipped but unused' || true)"
done

[ "$fail" = 0 ] && echo "OK" || echo "FAILED — a hand-rolled count increased; use the component instead"
exit "$fail"
