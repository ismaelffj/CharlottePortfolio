"""Render the favicon PNGs and the social image from the HTML sources in this folder.

Run from the project root: python3 scripts/render-assets.py
Needs Google Chrome and Pillow. Rerun when the name or description changes.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"
PUBLIC = ROOT / "public"


def screenshot(source: Path, size: str, output: Path, budget_ms: int = 0) -> None:
    args = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size={size}",
        f"--screenshot={output}",
    ]
    if budget_ms:
        args.append(f"--virtual-time-budget={budget_ms}")
    args.append(source.resolve().as_uri())
    subprocess.run(args, check=True, capture_output=True)


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        icon_shot = Path(tmp) / "icons.png"
        screenshot(SCRIPTS / "icons.html", "180,180", icon_shot)
        apple = Image.open(icon_shot).convert("RGB").crop((0, 0, 180, 180))
        apple.save(PUBLIC / "apple-touch-icon.png")
        apple.resize((32, 32), Image.LANCZOS).save(PUBLIC / "favicon.png")
        print("icons", apple.size, Image.open(PUBLIC / "favicon.png").size)

    screenshot(SCRIPTS / "og.html", "1200,630", PUBLIC / "og.png", budget_ms=10000)
    print("og", Image.open(PUBLIC / "og.png").size)


if __name__ == "__main__":
    sys.exit(main())
