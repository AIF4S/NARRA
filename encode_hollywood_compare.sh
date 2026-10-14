#!/usr/bin/env bash
# Featured Hollywood result: SANA-WM (frozen) | NARRA (1742), same image and camera path, side by side.
set -euo pipefail

d="/home/paula/video-diffusion/NARRA/results/custom_test_set/60s"
v="open_built_environments__straight__hollywood_blue_cadillac_straight6_lookleft_return.mp4"
site="/home/paula/NARRA_website/dist/media"
out="$site/compare/hollywood-blue-cadillac-60s.mp4"
poster="$site/posters/compare_hollywood-blue-cadillac-60s.jpg"

ffmpeg -hide_banner -loglevel warning -stats -i "$d/frozen/$v" -i "$d/1742/$v" \
  -filter_complex "[0:v]scale=960:528:flags=lanczos,setsar=1,pad=iw+4:ih:0:0:color=0x08060d[l];[1:v]scale=960:528:flags=lanczos,setsar=1[r];[l][r]hstack=shortest=1[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart -map_metadata -1 -y "$out"

ffmpeg -hide_banner -loglevel warning -ss 1 -i "$out" -frames:v 1 -q:v 3 -map_metadata -1 -y "$poster"
printf 'HOLLYWOOD_COMPARE_DONE\n'
