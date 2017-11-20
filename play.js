#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const utils = require('util');

const readdir = utils.promisify(fs.readdir);
const readFile = utils.promisify(fs.readFile);

/**
 * $ node play.js <frames_dir> <fps = 30>
 */
async function main(argv) {
  const dir = path.resolve(process.cwd(), argv[2]);
  const fps = +argv[3] || 30;
  const files = (await readdir(dir)).filter((file) => path.extname(file) === '.txt');
  const totalFrames = files.length;

  const frameQueue = [];

  let isLoading = false;
  let loadedFrameIndex = 0;

  async function loadMore() {
    if (!isLoading) {
      isLoading = true;
      const nextBound = Math.min(loadedFrameIndex + 2 * fps, totalFrames);
      for (; loadedFrameIndex < nextBound; loadedFrameIndex++) {
        const file = files[loadedFrameIndex];
        frameQueue.push(await readFile(path.join(dir, file), {encoding: 'utf-8'}));
      }
      isLoading = false;
    }
  }

  let renderedFrames = 0;

  const timer = setInterval(function tick() {
    const frame = frameQueue.shift();
    if (frame) {
      // render one frame
      console.clear();
      console.log(frame + '\n\n' + `progress: ${renderedFrames + 1}/${totalFrames}`);
      renderedFrames++;
    }
    if (frameQueue.length < 2 * fps) {
      // stop timer
      if (renderedFrames !== -1 && renderedFrames >= totalFrames) {
        console.log('done.');
        clearInterval(timer);
      } else {
        // load more frames from fs
        loadMore();
      }
    }
  }, 1 / fps * 1e3);

  console.log('loading...');
}

main(process.argv)
  .catch((err) => console.error(err));
