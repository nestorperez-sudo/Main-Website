#!/usr/bin/env python3
"""Summarize the site's visual vocabulary from its CSS files.

Usage: python style_scan.py [dir_or_css_files ...]   (default: current directory)
Prints tokens, hardcoded colors, and frequency-ranked type/spacing/radius/shadow/breakpoint values.
"""
import glob
import os
import re
import sys
from collections import Counter


def find_files(args):
    out = []
    for a in args or ["."]:
        if os.path.isdir(a):
            out += [f for f in glob.glob(os.path.join(a, "**", "*.css"), recursive=True)
                    if ".git" not in f and "node_modules" not in f]
        else:
            out.append(a)
    return sorted(out)


def hex_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def dist(a, b):
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


def top(counter, n=12):
    return ", ".join(f"{k} x{v}" for k, v in counter.most_common(n)) or "(none)"


def main():
    paths = find_files(sys.argv[1:])
    if not paths:
        print("No CSS files found.")
        return
    all_tokens = {}
    for p in paths:
        css = re.sub(r"/\*.*?\*/", "", open(p, encoding="utf-8").read(), flags=re.S)
        print(f"\n=== {p} ===")
        tokens = dict(re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", css))
        all_tokens[p] = tokens
        print("Tokens:", ", ".join(f"{k}={v.strip()}" for k, v in tokens.items()) or "(none)")

        token_rgb = {k: hex_rgb(v.strip()) for k, v in tokens.items()
                     if re.fullmatch(r"#[0-9a-fA-F]{3,6}", v.strip())}
        body = re.sub(r":root\s*\{.*?\}", "", css, flags=re.S)

        colors = Counter(c.lower() for c in re.findall(r"#[0-9a-fA-F]{3,6}\b|rgba?\([^)]*\)", body))
        print("\nHardcoded colors (outside :root):")
        for c, n in colors.most_common():
            note = ""
            if re.fullmatch(r"#[0-9a-f]{3,6}", c) and token_rgb:
                name, d = min(((k, dist(hex_rgb(c), v)) for k, v in token_rgb.items()),
                              key=lambda x: x[1])
                note = f"  == var({name})" if d == 0 else (f"  ~ near var({name})" if d < 40 else "")
            print(f"  {c} x{n}{note}")

        def prop(regex):
            return Counter(v.strip() for v in re.findall(regex, body))

        print("\nFont sizes:", top(prop(r"font-size\s*:\s*([^;]+);")))
        print("Font weights:", top(prop(r"font-weight\s*:\s*([^;]+);")))
        print("Padding:", top(prop(r"(?<![\w-])padding[\w-]*\s*:\s*([^;]+);")))
        print("Margin:", top(prop(r"(?<![\w-])margin[\w-]*\s*:\s*([^;]+);")))
        print("Gap:", top(prop(r"(?<![\w-])gap\s*:\s*([^;]+);")))
        print("Radius:", top(prop(r"border-radius\s*:\s*([^;]+);")))
        print("Borders:", top(prop(r"(?<![\w-])border(?:-(?!radius)\w+)?\s*:\s*([^;]+);")))
        shadows = Counter(re.sub(r"\s+", " ", s.strip())
                          for s in re.findall(r"box-shadow\s*:\s*([^;]+);", body))
        print("Shadows:", top(shadows, 6))
        print("Transitions:", top(prop(r"transition\s*:\s*([^;]+);"), 6))
        print("Breakpoints:", top(Counter(re.findall(r"@media\s*\(\s*(?:max|min)-width\s*:\s*(\d+px)", body))))

        typos = set(re.findall(r"transition\s*:\s*(transfrom|tranform)\b", body))
        if typos:
            print("\n! Typo in transition property:", typos)
        for sel, block in re.findall(r"([^{}]+)\{([^{}]*)\}", body):
            props = re.findall(r"([\w-]+)\s*:", block)
            dup = [k for k, v in Counter(props).items() if v > 1]
            if dup:
                print(f"! Duplicate declarations in `{sel.strip()}`: {', '.join(dup)}")

    names = set().union(*[set(t) for t in all_tokens.values()])
    for n in sorted(names):
        vals = {p: t[n].strip() for p, t in all_tokens.items() if n in t}
        if len(set(vals.values())) > 1:
            print(f"\n! Token {n} differs across files: {vals}")


if __name__ == "__main__":
    main()
