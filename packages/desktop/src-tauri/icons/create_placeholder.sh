#!/bin/bash
# Create a simple placeholder icon using ImageMagick or fallback
if command -v convert &> /dev/null; then
    convert -size 512x512 xc:#2c3e50 -pointsize 100 -fill white -gravity center -annotate +0+0 "PDV" icon.png
elif command -v magick &> /dev/null; then
    magick -size 512x512 xc:#2c3e50 -pointsize 100 -fill white -gravity center -annotate +0+0 "PDV" icon.png
else
    echo "ImageMagick not found. Creating minimal PNG..."
    # Create a minimal valid PNG (1x1 pixel, transparent)
    printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82' > icon.png
fi
