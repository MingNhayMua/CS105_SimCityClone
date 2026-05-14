"""
Blender headless script: batch convert FBX files to GLB (glTF Binary).
Usage:
    /Applications/Blender.app/Contents/MacOS/blender --background --python scripts/convert-fbx-to-glb.py -- [categories...]

Categories: buildings, tiles, props, vehicles, nature, construction, people, all
If no categories specified, converts buildings and tiles only.
"""
import bpy
import os
import sys
import time

ASSET_BASE = "/Users/minh/Desktop/Low Poly Epic City v1.7/My project/Assets/polyperfect/Low Poly Epic City/T/- Meshes_T"
OUTPUT_BASE = "/Users/minh/Desktop/SimCity/public/models"

CATEGORY_MAP = {
    "buildings":     "Buildings_T",
    "tiles":         "Tiles_T",
    "props":         "Props_T",
    "vehicles":      "Vehicles_T",
    "nature":        "Nature_T",
    "construction":  "Construction_T",
    "people":        "People_T",
}

def find_fbx_files(category_key):
    src_dir_name = CATEGORY_MAP[category_key]
    src_dir = os.path.join(ASSET_BASE, src_dir_name)
    if not os.path.isdir(src_dir):
        print(f"WARNING: Source directory not found: {src_dir}")
        return []

    fbx_files = []
    if category_key == "tiles":
        for root, dirs, files in os.walk(src_dir):
            for f in sorted(files):
                if f.lower().endswith('.fbx'):
                    fbx_files.append(os.path.join(root, f))
    else:
        for f in sorted(os.listdir(src_dir)):
            full = os.path.join(src_dir, f)
            if os.path.isfile(full) and f.lower().endswith('.fbx'):
                fbx_files.append(full)
    return fbx_files

def get_output_path(category_key, fbx_path):
    name = os.path.splitext(os.path.basename(fbx_path))[0] + ".glb"
    return os.path.join(OUTPUT_BASE, category_key, name)

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for mesh in bpy.data.meshes:
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    for mat in bpy.data.materials:
        if mat.users == 0:
            bpy.data.materials.remove(mat)
    for img in bpy.data.images:
        if img.users == 0:
            bpy.data.images.remove(img)

def convert_fbx_to_glb(fbx_path, output_path):
    bpy.ops.wm.read_factory_settings(use_empty=True)

    bpy.ops.import_scene.fbx(filepath=fbx_path)

    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,
        export_yup=True,
        export_apply=True,
    )

    result = os.path.exists(output_path) and os.path.getsize(output_path) > 0

    clear_scene()

    return result

def main():
    argv = sys.argv
    if "--" in argv:
        user_args = argv[argv.index("--") + 1:]
    else:
        user_args = []

    if len(user_args) == 0:
        categories = ["buildings", "tiles"]
    elif "all" in user_args:
        categories = list(CATEGORY_MAP.keys())
    else:
        categories = [c for c in user_args if c in CATEGORY_MAP]

    print(f"=== FBX -> GLB Conversion ===")
    print(f"Categories: {categories}")

    total = 0
    success = 0
    failed = 0

    for cat in categories:
        os.makedirs(os.path.join(OUTPUT_BASE, cat), exist_ok=True)
        fbx_files = find_fbx_files(cat)
        print(f"\n--- {cat}: {len(fbx_files)} files ---")

        for i, fbx_path in enumerate(fbx_files):
            name = os.path.basename(fbx_path)
            output_path = get_output_path(cat, fbx_path)

            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                print(f"  [{i+1}/{len(fbx_files)}] SKIP (exists): {name}")
                success += 1
                total += 1
                continue

            print(f"  [{i+1}/{len(fbx_files)}] Converting: {name}", end="", flush=True)
            start = time.time()

            try:
                ok = convert_fbx_to_glb(fbx_path, output_path)
                elapsed = time.time() - start
                if ok:
                    size_kb = os.path.getsize(output_path) / 1024
                    print(f" -> OK ({size_kb:.0f}KB, {elapsed:.1f}s)")
                    success += 1
                else:
                    print(f" -> FAILED (empty or missing output)")
                    failed += 1
            except Exception as e:
                print(f" -> ERROR: {e}")
                failed += 1

            total += 1

    print(f"\n=== Conversion Complete ===")
    print(f"Total: {total}, Success: {success}, Failed: {failed}")

if __name__ == "__main__":
    main()