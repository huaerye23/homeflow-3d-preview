from __future__ import annotations

import json
from pathlib import Path
from PIL import Image


ROOT = Path(r"D:\XM\Nx\home")
manifest = json.loads((ROOT / "layers.manifest.json").read_text(encoding="utf-8"))
checks = []

for layer in manifest["layers"]:
    asset = ROOT / "public" / layer["asset"].lstrip("/")
    with Image.open(asset) as image:
        expected = (layer["normalization"]["target_width"], layer["normalization"]["final_height"])
        actual = image.size
        checks.append(
            {
                "id": layer["id"],
                "asset": str(asset),
                "expected_size": list(expected),
                "actual_size": list(actual),
                "mode": image.mode,
                "transparent_required": layer["transparent_required"],
                "size_ok": actual == expected,
            }
        )
    asset_4k = ROOT / "public" / layer["asset_4k"].lstrip("/")
    with Image.open(asset_4k) as image:
        long_edge = max(image.size)
        checks.append(
            {
                "id": f"{layer['id']}-4k",
                "asset": str(asset_4k),
                "expected_size": [manifest["reference_4k_long_edge"]],
                "actual_size": list(image.size),
                "mode": image.mode,
                "transparent_required": False,
                "size_ok": long_edge == manifest["reference_4k_long_edge"],
            }
        )

for layer in manifest.get("key_regions_4k", []):
    asset = ROOT / "public" / layer["asset"].lstrip("/")
    with Image.open(asset) as image:
        checks.append(
            {
                "id": layer["id"],
                "asset": str(asset),
                "expected_size": [layer["size"]["width"], layer["size"]["height"]],
                "actual_size": list(image.size),
                "mode": image.mode,
                "transparent_required": False,
                "size_ok": list(image.size) == [layer["size"]["width"], layer["size"]["height"]] and max(image.size) == manifest["reference_4k_long_edge"],
            }
        )

report = {
    "schema": manifest["schema"],
    "artboard_width": manifest["artboard_width"],
    "reference_4k_long_edge": manifest.get("reference_4k_long_edge"),
    "asset_count": len(checks),
    "transparent_asset_count": sum(1 for item in checks if item["transparent_required"]),
    "checks": checks,
    "passed": all(item["size_ok"] for item in checks),
    "notes": "Official Fang.com huxing/furnished references plus structural CAD; 4K long edge is 3840.",
}
(ROOT / "qa" / "asset-audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))

if not report["passed"]:
    raise SystemExit(1)
