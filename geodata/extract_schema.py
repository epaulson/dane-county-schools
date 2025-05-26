import os
import json

# Directory containing your GeoJSON files
GEOJSON_DIR = "./"  # Change this to your actual directory
OUTPUT_FILE = "geojson_schemas.md"

def get_properties_schema(filepath):
    """Extract all unique property keys from a GeoJSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    keys = set()
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        keys.update(props.keys())
    
    return sorted(keys)

def main():
    geojson_files = [f for f in os.listdir(GEOJSON_DIR) if f.endswith(".geojson")]
    schemas = {}

    for filename in geojson_files:
        path = os.path.join(GEOJSON_DIR, filename)
        schema = get_properties_schema(path)
        schemas[filename] = schema

    with open(OUTPUT_FILE, "w", encoding="utf-8") as md:
        md.write("# GeoJSON Property Schemas\n\n")
        for filename, props in sorted(schemas.items()):
            md.write(f"## {filename}\n\n")
            if props:
                for prop in props:
                    md.write(f"- `{prop}`\n")
            else:
                md.write("_No properties found._\n")
            md.write("\n")

if __name__ == "__main__":
    main()

