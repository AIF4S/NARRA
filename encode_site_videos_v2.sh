#!/usr/bin/env bash
# Second batch: SANA-WM vs NARRA side-by-side comparisons, extra 60 s clips, 16 s clips.
set -euo pipefail

res="/home/paula/video-diffusion/Sana/results"
out="/home/paula/video-diffusion/narra_submission_website/dist/media"
log="/home/paula/video-diffusion/narra_submission_website/video_encode_v2.log"
mkdir -p "$out/compare" "$out/16s" "$out/posters"
: > "$log"

enc=(-an -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart -map_metadata -1)

poster() { ffmpeg -v error -ss 1 -i "$1" -frames:v 1 -q:v 4 -map_metadata -1 -y "$2"; }

# SANA-WM (frozen) | NARRA (1742), one synced video, 4 px dark gutter between halves.
compare=(
  "custom_test_set/60s/frozen/animated8_01_coastal_telescope_straight.mp4|custom_test_set/60s/1742/animated8_01_coastal_telescope_straight.mp4"
  "custom_test_set/60s/frozen/v14_04_forest_bicycle_shelter_pronounced_curve.mp4|custom_test_set/60s/1742/v14_04_forest_bicycle_shelter_pronounced_curve.mp4"
  "custom_test_set_rerun9_review/frozen/custom_revisit_v19_02_office_blue_desk__soft_revisit_generated.mp4|custom_test_set_rerun9_review/ttt/custom_revisit_v19_02_office_blue_desk__soft_revisit.mp4"
  "custom_test_set/60s/frozen/v27_01_colombian_hacienda_gentle_curve.mp4|custom_test_set/60s/1742/v27_01_colombian_hacienda_gentle_curve.mp4"
  "custom_test_set/60s/frozen/v30_01_museum_horse_left_aisle_straight.mp4|custom_test_set/60s/1742/v30_01_museum_horse_left_aisle_straight.mp4"
  "custom_test_set/60s/frozen/v30_08_mars_rover_left_track_pronounced_curve.mp4|custom_test_set/60s/1742/v30_08_mars_rover_left_track_pronounced_curve.mp4"
  "custom_test_set/60s/frozen/v30_20_desert_sports_car_left_road_pronounced_curve.mp4|custom_test_set/60s/1742/v30_20_desert_sports_car_left_road_pronounced_curve.mp4"
  "custom_test_set/60s/frozen/v30_26_persian_garden_right_axis_gentle_curve.mp4|custom_test_set/60s/1742/v30_26_persian_garden_right_axis_gentle_curve.mp4"
  "custom_test_set/60s/frozen/v34_04_archive_globe_right_pronounced_curve.mp4|custom_test_set/60s/1742/v34_04_archive_globe_right_pronounced_curve.mp4"
)
for pair in "${compare[@]}"; do
  a="$res/${pair%%|*}"; b="$res/${pair##*|}"
  name="$(basename "$b" .mp4)"; name="${name#custom_revisit_}"
  echo "START compare $name" | tee -a "$log"
  ffmpeg -hide_banner -loglevel error -i "$a" -i "$b" \
    -filter_complex "[0:v]scale=640:-2:flags=lanczos,pad=iw+4:ih:0:0:color=0x08060d[l];[1:v]scale=640:-2:flags=lanczos[r];[l][r]hstack=shortest=1[v]" \
    -map "[v]" "${enc[@]}" -y "$out/compare/$name.mp4" 2>> "$log"
  poster "$out/compare/$name.mp4" "$out/posters/compare_$name.jpg"
  echo "DONE compare $name" | tee -a "$log"
done

single() { # $1 source, $2 output dir, $3 poster prefix
  local name; name="$(basename "$1")"
  echo "START $2/$name" | tee -a "$log"
  ffmpeg -hide_banner -loglevel error -i "$1" -map 0:v:0 -vf "scale=960:-2:flags=lanczos" "${enc[@]}" -y "$2/$name" 2>> "$log"
  poster "$2/$name" "$out/posters/${3:-}${name%.mp4}.jpg"
  echo "DONE $2/$name" | tee -a "$log"
}

for f in sober9_01_sky_harbor_balloon__pronounced_rightturn25deg_thenstraight6m animated8_02_desert_crystal_sundial_straight animated8_04_snow_signal_beacon_straight; do
  single "$res/custom_test_set/60s/1742/$f.mp4" "$out"
done

for f in v13_02_mountain_horse_stable_pronounced_curve v15_06_fantasy_bird_mount_pronounced_curve v22_05_colombian_coffee_hacienda_straight \
         v24_01_voxel_coastal_house_road_return_gentle_curve v30_23_persian_turquoise_house_left_lane_straight \
         v30_21_hotel_piano_left_corridor_straight v30_19_fantasy_cottage_right_path_pronounced_curve v30_14_hollywood_convertible_left_lane_gentle_curve; do
  single "$res/custom_test_set/16s/1742/$f.mp4" "$out/16s" 16s_
done

echo "ALL_DONE" | tee -a "$log"
