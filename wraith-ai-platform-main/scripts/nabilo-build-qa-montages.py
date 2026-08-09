"""Build side-by-side visual QA sheets from the supplied references and captures."""

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / ".nabilo" / "screenshots"
OUTPUT = ROOT / ".nabilo" / "qa"
REFERENCE_ROOT = Path(
    os.environ.get("NABILO_REFERENCE_ROOT", Path.home() / "nabilo-reference-captures")
)

CASES = (
    (
        "overview",
        REFERENCE_ROOT / "nabilo-source-overview.jpg",
        (0, 398, 540, 805),
        SCREENSHOTS / "nabilo-soc-overview-final.png",
    ),
    (
        "attack-map",
        REFERENCE_ROOT / "nabilo-source-attack-map.jpg",
        (0, 442, 540, 756),
        SCREENSHOTS / "nabilo-soc-attack-map-final.png",
    ),
    (
        "mitre",
        REFERENCE_ROOT / "nabilo-source-mitre.jpg",
        (0, 442, 540, 756),
        SCREENSHOTS / "nabilo-soc-mitre.png",
    ),
)


def fit(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    contained = ImageOps.contain(image.convert("RGB"), size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, "#070c15")
    x = (size[0] - contained.width) // 2
    y = (size[1] - contained.height) // 2
    canvas.paste(contained, (x, y))
    return canvas


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    font = ImageFont.load_default(size=22)
    small = ImageFont.load_default(size=15)
    for name, reference_path, crop, implementation_path in CASES:
        reference = Image.open(reference_path).convert("RGB").crop(crop)
        implementation = Image.open(implementation_path).convert("RGB")
        sheet = Image.new("RGB", (1600, 720), "#050914")
        draw = ImageDraw.Draw(sheet)
        draw.text((40, 24), f"{name.upper()} - SOURCE / IMPLEMENTATION", fill="#e7eefb", font=font)
        draw.text((40, 58), "Source reference (cropped from supplied mobile capture)", fill="#7f90ad", font=small)
        draw.text((820, 58), "Nabilo SOC implementation (desktop capture)", fill="#7f90ad", font=small)
        sheet.paste(fit(reference, (740, 600)), (40, 90))
        sheet.paste(fit(implementation, (740, 600)), (820, 90))
        sheet.save(OUTPUT / f"nabilo-compare-{name}.png", optimize=True)


if __name__ == "__main__":
    main()
