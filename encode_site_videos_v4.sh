#!/usr/bin/env bash
# Fourth batch: 60 s world-model baselines (ReWorld | WorldPlay), museum horse scene, native 24 fps.
set -euo pipefail
d="/home/paula/video-diffusion/Sana/results/custom_test_set/60s"
out="/home/paula/video-diffusion/narra_submission_website/dist/media"
mkdir -p "$out/baselines60" "$out/posters"
v=v30_01_museum_horse_left_aisle_straight
ffmpeg -hide_banner -loglevel error -i "$d/reworld/$v.mp4" -i "$d/worldplay/v30_01_museum_horse_left_aisle_generated__traj_straight.mp4" \
  -filter_complex "[0:v]scale=640:352:flags=lanczos,setsar=1,pad=iw+4:ih:0:0:color=0x08060d[l];[1:v]crop=iw:trunc(iw*704/1280/2)*2,scale=640:352:flags=lanczos,setsar=1[r];[l][r]hstack=shortest=1[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart -map_metadata -1 -y "$out/baselines60/$v.mp4"
ffmpeg -v error -i "$out/baselines60/$v.mp4" -frames:v 1 -q:v 4 -map_metadata -1 -y "$out/posters/baselines60_$v.jpg"
echo DONE
