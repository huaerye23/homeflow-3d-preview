from __future__ import annotations

import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(r"D:\XM\Nx\home")
SOURCE_STRUCT = ROOT / "sources" / "structural-plan.png"
SOURCE_HUXING = ROOT / "sources" / "official-huxing.png"
SOURCE_FURNISHED = ROOT / "sources" / "official-furnished.png"
FANG_HUXING = ROOT / "sources" / "fang" / "huxing-orig.png"
FANG_FURNISHED = ROOT / "sources" / "fang" / "house-orig.jpg"
OUT = ROOT / "public" / "references"
QA = ROOT / "qa"
FOUR_K = 3840
FURNISHED_CROP = (150, 355, 980, 1248)
HUXING_REGIONS = {
    "key-west": (0.00, 0.00, 0.44, 1.00),
    "key-center": (0.32, 0.00, 0.74, 1.00),
    "key-east": (0.64, 0.00, 1.00, 1.00),
}
SOURCE_URL = "https://cs.newhouse.fang.com/loupan/2710200130/photo/d_house_1581048.htm"


def ensure_official_sources():
    SOURCE_HUXING.parent.mkdir(parents=True, exist_ok=True)
    if FANG_HUXING.exists():
        Image.open(FANG_HUXING).convert("RGB").save(SOURCE_HUXING, optimize=True)
    furnished = Image.open(FANG_FURNISHED).convert("RGB").crop(FURNISHED_CROP)
    furnished.save(SOURCE_FURNISHED, optimize=True)
    return furnished


def to_4k(image: Image.Image) -> Image.Image:
    width, height = image.size
    if width >= height:
        size = (FOUR_K, max(1, round(height * FOUR_K / width)))
    else:
        size = (max(1, round(width * FOUR_K / height)), FOUR_K)
    return image.resize(size, Image.Resampling.LANCZOS)


def to_750(image: Image.Image) -> Image.Image:
    width, height = image.size
    scale = 750 / width
    return image.resize((750, max(1, round(height * scale))), Image.Resampling.LANCZOS), scale


def bbox_preview(image: Image.Image, name: str, bbox: tuple[int, int, int, int]):
    preview = image.copy()
    draw = ImageDraw.Draw(preview)
    x, y, w, h = bbox
    line = max(4, image.size[0] // 280)
    draw.rectangle((x, y, x + w, y + h), outline="#f35a3e", width=line)
    preview.save(QA / f"{name}-bbox-preview.png", optimize=True)


def layer_record(name: str, source: Path, image: Image.Image, bbox: tuple[int, int, int, int], note: str, asset: str, scale: float, final_height: int):
    x, y, w, h = bbox
    width, height = image.size
    return {
        "id": name,
        "type": "bitmap-reference",
        "source_file": str(source),
        "source_size": {"width": width, "height": height},
        "source_bbox": {"x": x, "y": y, "width": w, "height": h},
        "normalization": {
            "target_width": 750,
            "scale": round(scale, 8),
            "final_height": final_height,
        },
        "scaled_bbox": {
            "x": round(x * scale, 2),
            "y": round(y * scale, 2),
            "width": round(w * scale, 2),
            "height": round(h * scale, 2),
        },
        "asset": asset,
        "asset_4k": f"/references/{name}-4k.png",
        "z_index": 1,
        "transparent_required": False,
        "notes": note,
    }


def save_pair(name: str, image: Image.Image, source: Path):
    preview_750, scale = to_750(image)
    image_4k = to_4k(image)
    preview_750.save(OUT / f"{name}-750.png", optimize=True)
    image_4k.save(OUT / f"{name}-4k.png", optimize=True)
    suffix = source.suffix if source.suffix else ".png"
    shutil.copy2(source, OUT / f"{name}-original{suffix}")
    return preview_750, image_4k, scale


def save_key_regions(huxing: Image.Image):
    width, height = huxing.size
    records = []
    for name, (x0, y0, x1, y1) in HUXING_REGIONS.items():
        box = (round(width * x0), round(height * y0), round(width * x1), round(height * y1))
        crop = huxing.crop(box)
        image_4k = to_4k(crop)
        image_4k.save(OUT / f"{name}-4k.png", optimize=True)
        crop.save(QA / f"{name}-source.png", optimize=True)
        records.append({
            "id": name,
            "type": "bitmap-reference-4k",
            "source_file": str(SOURCE_HUXING),
            "source_bbox": {
                "x": box[0],
                "y": box[1],
                "width": box[2] - box[0],
                "height": box[3] - box[1],
            },
            "size": {"width": image_4k.size[0], "height": image_4k.size[1]},
            "asset": f"/references/{name}-4k.png",
            "notes": "官方户型分析图关键区域 4K 放大，便于核对墙体、门洞与分区。",
        })
    return records


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    ensure_official_sources()

    structural = Image.open(SOURCE_STRUCT).convert("RGB")
    huxing = Image.open(SOURCE_HUXING).convert("RGB")
    furnished = Image.open(SOURCE_FURNISHED).convert("RGB")

    structural_750, structural_4k, structural_scale = save_pair("structural-plan", structural, SOURCE_STRUCT)
    huxing_750, huxing_4k, huxing_scale = save_pair("official-huxing", huxing, SOURCE_HUXING)
    furnished_750, furnished_4k, furnished_scale = save_pair("official-furnished", furnished, SOURCE_FURNISHED)
    # Keep legacy filename used by older QA screenshots / docs.
    shutil.copy2(OUT / "official-furnished-750.png", OUT / "furnished-plan-750.png")

    bbox_preview(structural, "structural-plan", (16, 22, 998, 724))
    bbox_preview(huxing, "official-huxing", (3, 3, huxing.size[0] - 6, huxing.size[1] - 6))
    bbox_preview(furnished, "official-furnished", (0, 0, furnished.size[0], furnished.size[1]))

    key_layers = save_key_regions(huxing)

    layers = [
        layer_record(
            "structural-plan",
            SOURCE_STRUCT,
            structural,
            (16, 22, 998, 724),
            "原始结构与尺寸依据；矩形白底属于工程图本身。",
            "/references/structural-plan-750.png",
            structural_scale,
            structural_750.size[1],
        ),
        layer_record(
            "official-huxing",
            SOURCE_HUXING,
            huxing,
            (3, 3, huxing.size[0] - 6, huxing.size[1] - 6),
            f"房天下官方户型分析图，作为新底图。来源 {SOURCE_URL}",
            "/references/official-huxing-750.png",
            huxing_scale,
            huxing_750.size[1],
        ),
        layer_record(
            "official-furnished",
            SOURCE_FURNISHED,
            furnished,
            (0, 0, furnished.size[0], furnished.size[1]),
            "房天下官方「棠悦」142㎡ 生活场景A装修示意图，已裁户型本体并输出 4K。",
            "/references/official-furnished-750.png",
            furnished_scale,
            furnished_750.size[1],
        ),
    ]

    manifest = {
        "schema": "image-to-code.layers.v1",
        "generated_from": SOURCE_URL,
        "artboard_width": 750,
        "reference_4k_long_edge": FOUR_K,
        "layers": layers,
        "key_regions_4k": key_layers,
        "derived_model": {
            "ceiling_height_m": 2.83,
            "model_extent_m": {"width": 15.17, "depth": 9.77},
            "calculated_partition_area_m2": 120.7,
            "calculated_interior_area_m2": 112.7,
            "calculated_balcony_area_m2": 8.0,
            "model_envelope_area_m2": 148.2,
            "area_basis": "sum of non-overlapping interior and balcony width x depth rectangles; foyer overlaps living and is excluded; elevator/common-area void excluded",
            "orientation": "north-up official huxing; structural CAD is south-up and flipped before modeling",
            "measurement_status": "concept preview; site re-measurement required before construction",
        },
        "outputs": {
            "structural_4k": list(structural_4k.size),
            "official_huxing_4k": list(huxing_4k.size),
            "official_furnished_4k": list(furnished_4k.size),
            "key_regions": {item["id"]: [item["size"]["width"], item["size"]["height"]] for item in key_layers},
        },
    }
    text = json.dumps(manifest, ensure_ascii=False, indent=2)
    (ROOT / "layers.manifest.json").write_text(text, encoding="utf-8")
    (OUT / "layers.manifest.json").write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
