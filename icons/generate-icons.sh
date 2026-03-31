#!/bin/bash
# Script pour generer les icones PNG a partir d'un SVG source
# Prerequis : Inkscape ou ImageMagick installe
#
# Usage: ./generate-icons.sh icon-source.svg
#
# Si vous n'avez pas de SVG, vous pouvez creer les icones manuellement :
# - icon-16.png  (16x16 pixels)
# - icon-48.png  (48x48 pixels)
# - icon-128.png (128x128 pixels)
#
# Les icones doivent etre au format PNG avec fond transparent.

SOURCE="${1:-icon-source.svg}"

if command -v convert &> /dev/null; then
  # ImageMagick
  convert -background none "$SOURCE" -resize 16x16 icon-16.png
  convert -background none "$SOURCE" -resize 48x48 icon-48.png
  convert -background none "$SOURCE" -resize 128x128 icon-128.png
  echo "Icons generated with ImageMagick"
elif command -v inkscape &> /dev/null; then
  # Inkscape
  inkscape "$SOURCE" -w 16 -h 16 -o icon-16.png
  inkscape "$SOURCE" -w 48 -h 48 -o icon-48.png
  inkscape "$SOURCE" -w 128 -h 128 -o icon-128.png
  echo "Icons generated with Inkscape"
else
  echo "Please install ImageMagick or Inkscape to generate icons"
  echo "Or create icon-16.png, icon-48.png, icon-128.png manually"
fi
