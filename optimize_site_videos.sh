#!/usr/bin/env bash
set -euo pipefail

site_root="/home/paula/NARRA_website"
media_root="$site_root/dist/media"
work_root="/home/paula/NARRA_website_video_optimization_tmp"
archive_root="/home/paula/NARRA_website_source_archive_20261014/original_videos"
manifest="/home/paula/NARRA_website_source_archive_20261014/video_optimization.tsv"

mkdir -p "$work_root" "$archive_root" "$(dirname "$manifest")"
printf 'relative_path\toriginal_bytes\tdelivery_bytes\taction\n' > "$manifest"

while IFS= read -r -d '' source_video; do
  relative_path="${source_video#"$media_root/"}"
  optimized_video="$work_root/$relative_path"
  archived_video="$archive_root/$relative_path"
  mkdir -p "$(dirname "$optimized_video")" "$(dirname "$archived_video")"

  original_bytes=$(stat -c '%s' "$source_video")

  if [[ -f "$archived_video" ]]; then
    archived_bytes=$(stat -c '%s' "$archived_video")
    printf '%s\t%s\t%s\t%s\n' "$relative_path" "$archived_bytes" "$original_bytes" "already-optimized" >> "$manifest"
    continue
  fi

  original_duration=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$source_video")
  original_geometry=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$source_video")

  ffmpeg -nostdin -hide_banner -loglevel error -stats -i "$source_video" \
    -map 0:v:0 -an -c:v libx264 -preset medium -crf 29 \
    -pix_fmt yuv420p -movflags +faststart -map_metadata -1 -y "$optimized_video"

  optimized_duration=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$optimized_video")
  optimized_geometry=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$optimized_video")
  optimized_bytes=$(stat -c '%s' "$optimized_video")

  awk -v a="$original_duration" -v b="$optimized_duration" 'BEGIN {d=a-b; if (d<0) d=-d; exit(d>0.10)}'
  test "$original_geometry" = "$optimized_geometry"

  if (( optimized_bytes < original_bytes )); then
    mv "$source_video" "$archived_video"
    mv "$optimized_video" "$source_video"
    action="optimized"
    delivery_bytes="$optimized_bytes"
  else
    rm -f "$optimized_video"
    action="kept-original"
    delivery_bytes="$original_bytes"
  fi

  printf '%s\t%s\t%s\t%s\n' "$relative_path" "$original_bytes" "$delivery_bytes" "$action" >> "$manifest"
done < <(find "$media_root" -type f -name '*.mp4' -print0 | sort -z)

printf 'VIDEO_OPTIMIZATION_COMPLETE\n'
