#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const utils = require('util');
const sharp = require('sharp');

function bound(value, interval) {
  return Math.max(interval[0], Math.min(interval[1], value));
}

function imageToAscii({data, width, height, contrast, channels = 3}) {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const characters = ' .,:;i1tfLCG08@'.split('');
  const asciiCharacters = [];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * channels;
      const [red, green, blue] = [data[offset], data[offset + 1], data[offset + 2]];

      const r = bound(Math.floor((red - 128) * factor) + 128, [0, 255]);
      const g = bound(Math.floor((green - 128) * factor) + 128, [0, 255]);
      const b = bound(Math.floor((blue - 128) * factor) + 128, [0, 255]);

      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const character = characters[(characters.length - 1) - Math.round(brightness * (characters.length - 1))];

      asciiCharacters.push(character);
    }
    asciiCharacters.push('\n');
  }
  return asciiCharacters.slice(0, -1).join('');
}

const readdir = utils.promisify(fs.readdir);

/**
 * $ node img2text.js <input_dir>
 */
async function main(argv) {
  const dir = path.resolve(process.cwd(), argv[2]);
  const files = (await readdir(dir)).filter((file) => /^\.png|jpe?g|webp|tiff$/.test(path.extname(file)));
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = path.extname(file);
    const image = path.join(dir, file);
    sharp(image)
      .raw()
      .toBuffer(function (err, data, info) {
        if (err) {
          console.error(`[skip] ${image}:`, err);
        } else {
          console.log(`processing: ${file}, ${i + 1}/${files.length}`);
          const text = imageToAscii({
            data: data,
            width: info.width,
            height: info.height,
            channels: info.channels,
            contrast: 32,
          });
          const txtFile = path.format({
            dir: dir,
            name: path.basename(file, ext),
            ext: '.txt',
          });
          fs.writeFile(txtFile, text, function (err) {
            if (err) {
              console.error(`[skip] ${image}:`, err);
            }
          });
        }
      });
  }
}

main(process.argv)
  .catch((err) => console.error(err));
