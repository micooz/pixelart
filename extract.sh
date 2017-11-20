#!/usr/bin/env bash

# $ ./extract.sh <video> <from> <frames> <output_dir>
# $ ./extract.sh video.mp4 0:0:0 1000 ./output

video=$1
from=$2
frames=$3
output=$4

# extract video frames
ffmpeg -i "${video}" -ss "${from}" -s 128x64 -vframes ${frames} "${output}/%05d.png" -y

# extract audio frames
if [ $? -eq 0 ];then
  ffmpeg -i "${video}" -ss "${from}" -aframes ${frames} -strict -2 "${output}/bgm.aac" -y
fi

# convert frames to text files
if [ $? -eq 0 ];then
  node scripts/img2text.js ${output}
fi

# remove intermediate files
rm ${output}/*.png
