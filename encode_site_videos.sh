#!/usr/bin/env bash
set -euo pipefail

source_dir="/home/paula/video-diffusion/Sana/results/custom_test_set/60s/1742"
output_dir="/home/paula/video-diffusion/narra_submission_website/dist/media"
log_file="/home/paula/video-diffusion/narra_submission_website/video_encode.log"

mkdir -p "$output_dir"
: > "$log_file"

videos=(
  "v20_09_persia_yazd_windcatcher_lane_pronounced_curve.mp4"
  "v24_08_mangrove_stilt_village_channel_return_pronounced_curve.mp4"
  "v24_r2_02_snow_chalet_straight.mp4"
  "v27_01_colombian_hacienda_gentle_curve.mp4"
  "v30_01_museum_horse_left_aisle_straight.mp4"
  "v30_04_observatory_telescope_right_aisle_straight.mp4"
  "v30_05_voxel_mine_rail_right_lane_gentle_curve.mp4"
  "v30_08_mars_rover_left_track_pronounced_curve.mp4"
  "v30_12_la_food_truck_left_road_gentle_curve.mp4"
  "v30_20_desert_sports_car_left_road_pronounced_curve.mp4"
  "v30_22_greenhouse_fountain_right_aisle_straight.mp4"
  "v31_09_persian_courtyard_left_axis_generated__traj_straight.mp4"
  "v32_10_mediterranean_flower_street_generated__traj_gentle_curve.mp4"
)

for video in "${videos[@]}"; do
  input="$source_dir/$video"
  output="$output_dir/$video"
  echo "START $video" | tee -a "$log_file"
  ffmpeg -hide_banner -loglevel error -stats \
    -i "$input" \
    -map 0:v:0 -an \
    -vf "scale=960:-2:flags=lanczos" \
    -c:v libx264 -preset slow -crf 25 \
    -pix_fmt yuv420p -movflags +faststart \
    -y "$output" 2>> "$log_file"
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=codec_name,width,height,r_frame_rate \
    -show_entries format=duration,size \
    -of default=noprint_wrappers=1 "$output" >> "$log_file"
  echo "DONE $video" | tee -a "$log_file"
done

echo "ALL_DONE ${#videos[@]}" | tee -a "$log_file"
