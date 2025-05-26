#!/bin/bash

# Exit immediately if a command fails
set -e

# Loop through all .geojson files in the current directory
for file in *.geojson; do
  # Get the base name (strip .geojson extension)
  base="${file%.geojson}"
  # Define the output filename
  output="${base}.pbf"
  # Convert to geobuf
  echo "Converting $file -> $output"
  ../node_modules/geobuf/bin/json2geobuf "$file" > "$output"
done

echo "All files converted to .pbf."

