"""
Restamp the cache-busting version across index.html and js/app.js.

Run this after editing any file under js/ so browsers refetch instead of
serving a stale cached module.

    py bump_version.py            # use today's date, auto-increment suffix
    py bump_version.py 2026.10.1-1  # set an explicit version
    py bump_version.py --show      # just print the current version
"""

import pathlib
import re
import sys
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent
HTML = ROOT / "index.html"
APP = ROOT / "js" / "app.js"

# Matches the stamp across any year in both places it appears.
STAMP = re.compile(r"\d{4}\.\d{2}\.\d{2}-\d+")


def read_stamp() -> str | None:
    html = HTML.read_text(encoding="utf-8")
    m = STAMP.search(html)
    return m.group(0) if m else None


def auto_version() -> str:
    today = date.today().strftime("%Y.%m.%d")
    current = read_stamp()
    if current and current.startswith(today):
        try:
            n = int(current.rsplit("-", 1)[1]) + 1
        except ValueError:
            n = 1
    else:
        n = 1
    return f"{today}-{n}"


def main() -> None:
    if "--show" in sys.argv:
        print(read_stamp() or "no stamp found")
        return

    new = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else auto_version()
    if not STAMP.fullmatch(new):
        print(f"Invalid version '{new}'. Expected YYYY.MM.DD-N, e.g. 2026.09.26-1")
        sys.exit(1)

    for path in (HTML, APP):
        text = path.read_text(encoding="utf-8")
        if not STAMP.search(text):
            print(f"WARNING: no version stamp found in {path.relative_to(ROOT)}")
            continue
        updated = STAMP.sub(new, text)
        path.write_text(updated, encoding="utf-8")
        print(f"stamped {path.relative_to(ROOT)} -> {new}")


if __name__ == "__main__":
    main()
