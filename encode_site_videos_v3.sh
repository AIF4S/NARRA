#!/usr/bin/env bash
# Third batch: 16 s five-method comparisons and SANA benchmark (SANA-WM vs NARRA, 60 s).
set -euo pipefail

res="/home/paula/video-diffusion/Sana/results"
out="/home/paula/video-diffusion/narra_submission_website/dist/media"
log="/home/paula/video-diffusion/narra_submission_website/video_encode_v3.log"
mkdir -p "$out/compare16" "$out/benchmark" "$out/posters"
: > "$log"

enc=(-an -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart -map_metadata -1)
poster() { ffmpeg -v error -ss 1 -i "$1" -frames:v 1 -q:v 4 -map_metadata -1 -y "$2"; }

# 16 s: top row SANA-WM | NARRA (640x352), bottom row DreamX | ReWorld | WorldPlay (424x234).
# All inputs resampled to 16 fps; WorldPlay (832x480) center-cropped to 1280:704 aspect; trimmed to shortest.
bg=0x08060d
for v in v13_02_mountain_horse_stable_pronounced_curve v13_07_coastal_boat_pier_gentle_curve \
         v30_05_voxel_mine_rail_right_lane_gentle_curve v30_11_echo_park_swan_right_path_straight \
         v30_20_desert_sports_car_left_road_pronounced_curve v30_27_desert_teahouse_left_road_gentle_curve; do
  d="$res/custom_test_set/16s"
  echo "START compare16 $v" | tee -a "$log"
  ffmpeg -hide_banner -loglevel error \
    -i "$d/frozen/$v.mp4" -i "$d/1742/$v.mp4" -i "$d/dreamx_world_5b/$v.mp4" -i "$d/reworld/$v.mp4" -i "$d/worldplay/$v.mp4" \
    -filter_complex "\
[0:v]fps=16,scale=640:352:flags=lanczos,setsar=1[a];\
[1:v]fps=16,scale=640:352:flags=lanczos,setsar=1[b];\
[2:v]fps=16,scale=424:234:flags=lanczos,setsar=1[c];\
[3:v]fps=16,scale=424:234:flags=lanczos,setsar=1[d];\
[4:v]fps=16,crop=iw:trunc(iw*704/1280/2)*2,scale=424:234:flags=lanczos,setsar=1[e];\
[a][b][c][d][e]xstack=inputs=5:layout=0_0|644_0|0_356|430_356|860_356:fill=$bg:shortest=1[v]" \
    -map "[v]" "${enc[@]}" -y "$out/compare16/$v.mp4" 2>> "$log"
  poster "$out/compare16/$v.mp4" "$out/posters/compare16_$v.jpg"
  echo "DONE compare16 $v" | tee -a "$log"
done

# SANA benchmark: SANA-WM (01_control_frozen) | NARRA (1742 exact1665 channelwise), 60 s.
narra="$res/34_camera_memory_combined/1742_exact1665_matched_pose_lambda0p035_channelwise_s24_balanced40_u40_s42"
for v in hard__indoor_016 hard__outdoor_city_011 hard__outdoor_nature_009 simple__game_style_001 simple__game_style_014 simple__outdoor_city_010; do
  echo "START benchmark $v" | tee -a "$log"
  ffmpeg -hide_banner -loglevel error -i "$res/01_control_frozen/$v.mp4" -i "$narra/$v.mp4" \
    -filter_complex "[0:v]scale=640:-2:flags=lanczos,pad=iw+4:ih:0:0:color=$bg[l];[1:v]scale=640:-2:flags=lanczos[r];[l][r]hstack=shortest=1[v]" \
    -map "[v]" "${enc[@]}" -y "$out/benchmark/$v.mp4" 2>> "$log"
  poster "$out/benchmark/$v.mp4" "$out/posters/benchmark_$v.jpg"
  echo "DONE benchmark $v" | tee -a "$log"
done

echo "ALL_DONE" | tee -a "$log"
