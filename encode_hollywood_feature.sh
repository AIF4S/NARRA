#!/usr/bin/env bash
set -euo pipefail

root="/home/paula/video-diffusion"
site="/home/paula/NARRA_website"
source_video="$root/NARRA/results/custom_test_set/60s/1742/open_built_environments__straight__hollywood_blue_cadillac_straight6_lookleft_return.mp4"
output_video="$site/dist/media/hollywood-blue-cadillac-60s.mp4"
output_poster="$site/dist/media/posters/hollywood-blue-cadillac-60s.jpg"

ffmpeg -hide_banner -loglevel warning -stats \
  -i "$source_video" \
  -vf "scale=960:-2:flags=lanczos" \
  -an -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart \
  -y "$output_video"

ffmpeg -hide_banner -loglevel warning \
  -ss 1 -i "$output_video" -frames:v 1 -q:v 2 -y "$output_poster"

printf 'HOLLYWOOD_FEATURE_DONE\n'
