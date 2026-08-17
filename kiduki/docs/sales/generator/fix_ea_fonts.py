#!/usr/bin/env python3
"""Add <a:ea> (East Asian) font tags next to every <a:latin> so Japanese text
renders with the intended Hiragino faces, and set theme EA defaults."""
import re, sys, zipfile, shutil, os, tempfile

def fix(path):
    tmpd = tempfile.mkdtemp()
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        z.extractall(tmpd)
    n_fixed = 0
    for name in names:
        if not name.endswith(".xml"):
            continue
        if not (name.startswith("ppt/slides/slide") or "slideMaster" in name or "theme" in name):
            continue
        p = os.path.join(tmpd, name)
        with open(p, encoding="utf-8") as f:
            xml = f.read()
        orig = xml
        # duplicate each latin typeface as ea typeface (only when no ea follows already)
        xml = re.sub(
            r'(<a:latin typeface="([^"]+)"[^/]*/>)(?!<a:ea)',
            lambda m: m.group(1) + f'<a:ea typeface="{m.group(2)}"/>',
            xml,
        )
        # theme default EA fonts
        xml = xml.replace('<a:ea typeface=""/>', '<a:ea typeface="Hiragino Kaku Gothic ProN"/>')
        if xml != orig:
            with open(p, "w", encoding="utf-8") as f:
                f.write(xml)
            n_fixed += 1
    out = path  # rewrite in place
    if os.path.exists(out):
        os.remove(out)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(tmpd):
            for fn in files:
                full = os.path.join(root, fn)
                rel = os.path.relpath(full, tmpd)
                z.write(full, rel)
    shutil.rmtree(tmpd)
    print(f"{os.path.basename(path)}: EA fonts fixed in {n_fixed} parts")

for p in sys.argv[1:]:
    fix(p)
