import React, { useState, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
// import soundfile from "./DJ-Memory-Welcome-To-The-Jungle.mp3";
// import soundfile from "./music.mp3";
import soundfile from "./asset/eenight.wav";

// import MediaElement from 'wavesurfer.js/src/mediaelement.js'

function wavesurferInitilize(check) {
  if (check === undefined) {
    const wavesurfer = WaveSurfer.create({
      container: "#waveform",
      // barWidth: 2,
      // barHeight: 1, // the height of the wave
      // barGap: null
      scrollParent: true,
      // plugins: [
      //   WaveSurfer.timeline.create({
      //     container: "#wave-timeline",
      //   }),
      // ],

      // backend: 'MediaElement'
    });
    wavesurfer.load(soundfile);

    wavesurfer.on("ready", () => {
      // const length = wavesurfer.getDuration();
      // const start = 0;
      // const end = length;
      // console.log(wavesurfer.backend.getPeaks(length, start, end));
      // console.log(wavesurfer.seekTo(wavesurfer.backend.getPeaks(length, start, end)[0]))
      // console.log(wavesurfer.getCurrentTime());
      // const lowpass = wavesurfer.backend.ac.createBiquadFilter();
      // wavesurfer.backend.setFilter(lowpass);
    });

    return wavesurfer;
  }
  return check;
}

function Timeline() {
  const [wavesurfer, setWavesurfer] = useState();
  const [pict, setPict] = useState();
  const [interval, setInterval] = useState(60 / 144);
  const [peak, setPeak] = useState();
  const upperBPM = 200;
  const lowerBPM = 90;

  // const [beat, setBeat] = useState();
  // const [fin, setFin] = useState(false);

  // const play = () => {
  //   wavesurfer.play();
  // };

  let musicbuffer = null;
  let data = null;
  const dao = new (window.AudioContext || window.webkitAudioContext)();

  // const getPeaks = (musicdata) => {
  //   const peaks = [];
  //   for (let i = 1; i < musicdata.length - 1; i += 1) {
  //     if (musicdata[i - 1] > musicdata[i] && musicdata[i] === 0) {
  //       peaks.push(i);
  //     }
  //   }
  //   return peaks;
  // };

  function getPeaksAtThreshold(
    musicdata,
    threashold,
    Subthreashold,
    originaldata
  ) {
    console.log(threashold, Subthreashold);
    const peaksArray = [];
    // const Peaks = getPeaks(musicdata);
    const { length } = originaldata;
    let findLower = true;
    for (let i = 0; i < length; i += 1) {
      if (!findLower && originaldata[i] < Subthreashold) findLower = true;
      if (
        originaldata[i] > threashold &&
        musicdata[i - 1] > musicdata[i] &&
        musicdata[i] === 0 &&
        findLower
      ) {
        peaksArray.push(i / 44100);
        i += 11000;
        findLower = false;
        // Skip forward ~ 1/4s to get past this peak.
      }
    }
    return peaksArray;
  }

  function countIntervalsBetweenNearbyPeaks(peaks) {
    const intervals = [];
    peaks.forEach((Peak, index) => {
      for (let i = 0; i < 10; i += 1) {
        let int = 60 / (peaks[index + i] - Peak);
        if (int !== Infinity && int !== 0) {
          while (int < lowerBPM) int *= 2;
          // while (int > upperBPM) int /= 2;
        }
        if (int <= upperBPM) intervals.push(Math.round(int));
      }
    });

    const intervalCounts = [];
    // peaks.forEach((peak, index) => {
    //   for (let i = 0; i < 10; i += 1) {
    //     const foundInterval = intervalCounts.some((intervalCount) => {
    //       if (intervalCount.interval === interval)
    //         return intervalCount.count + 1;
    //     });
    //     if (!foundInterval) {
    //       intervalCounts.push({
    //         interval,
    //         count: 1,
    //       });
    //     }
    //   }
    // });
    for (let i = 0; i < intervals.length; i += 1) {
      const thisInt = intervals[i];

      const foundInterval = intervalCounts.some((intervalCount) => {
        if (intervalCount.interval === thisInt) {
          intervalCount.count += 1;
          return true;
        }
        return false;
      });

      if (!foundInterval) {
        intervalCounts.push({
          interval: thisInt,
          count: 1,
        });
      }
    }
    return intervalCounts;
  }

  const musicProcessing = (Data) => {
    const musicdata = [];
    const musicData = [];
    let mean = 0;
    // console.log(musicdata);
    for (let i = 0; i < Data.length; i += 1) {
      musicdata.push(Data[i] ** 2);
    }
    // console.log(musicdata);
    for (let i = 0; i < musicdata.length - 1; i += 1) {
      if (musicdata[i + 1] - musicdata[i] > 0)
        musicData.push((musicdata[i + 1] - musicdata[i]) * 44100);
      else musicData.push(0);
    }
    for (let i = 0; i < musicdata.length; i += 1) mean += musicdata[i];
    const Threashold = (mean / musicdata.length) * 3;
    const Subthreashold = mean / musicdata.length / 1000;
    return [musicData, Threashold, Subthreashold, musicdata];
  };
  function loadMusic(url) {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = () => {
      dao.decodeAudioData(request.response, (buffer) => {
        // Create offline context
        const offlineContext = new OfflineAudioContext(
          1,
          buffer.length,
          buffer.sampleRate
        );

        // Create buffer source
        const source = offlineContext.createBufferSource();
        source.buffer = buffer;

        // Create filter
        const filter = offlineContext.createBiquadFilter();
        filter.type = "lowpass";

        // Pipe the song into the filter, and the filter into the offline context
        source.connect(filter);
        filter.connect(offlineContext.destination);

        // Schedule the song to start playing at time:0
        source.start(0);

        // Render the song
        offlineContext.startRendering();

        // Act on the result
        offlineContext.oncomplete = (e) => {
          // Filtered buffer!
          const filteredBuffer = e.renderedBuffer;
          musicbuffer = filteredBuffer;
          data = filteredBuffer.getChannelData(0);
          const data2 = musicProcessing(data);
          const b = getPeaksAtThreshold(data2[0], data2[1], data2[2], data2[3]);
          setPeak(b);
          const c = countIntervalsBetweenNearbyPeaks(b);

          let MaxInt = 0;
          let MaxCou = 0;
          for (let i = 1; i < c.length; i += 1) {
            if (c[i].count > MaxCou) {
              MaxCou = c[i].count;
              MaxInt = c[i].interval;
            }
          }
          console.log(`max interval: ${MaxInt}, count= ${MaxCou}`);
          // setInterval(MaxInt / 1000);
          console.log("bpm:", MaxInt);
          setInterval(60 / MaxInt);
        };

        // musicbuffer = buffer;
        // data = buffer.getChannelData(0);
        // console.log(getPeaksAtThreshold(data, 0.03));
        // var b = getPeaksAtThreshold(data, 0.03);
        // var c = countIntervalsBetweenNearbyPeaks(b)
        // console.log(c);
        // // var beatString = '';
        // // for(var i=0; i<b.length;i++){
        // //   beatString+=`${b[i]}, `;
        // // }
        // // console.log(beatString);
        // //genFig(b, data.length);
        // var max_int = 0;
        // var max_cou = 0;
        // for(var i=1; i<c.length; i++){
        //   if(c[i].count>max_cou){
        //     max_cou = c[i].count;
        //     max_int = c[i].interval;
        //   }
        // }
        // console.log(`max interval: ${max_int}, count= ${max_cou}`)
      });
    };
    request.send();
  }

  useEffect(() => {
    setPict(loadMusic(soundfile));
    setWavesurfer(wavesurferInitilize(wavesurfer));
  }, []);

  const findPosLast = (currentTime) => {
    let lowerLimit = 0;
    let HigherLimit = peak.length;
    while (lowerLimit !== HigherLimit) {
      const mid = Math.floor((lowerLimit + HigherLimit) / 2);
      if (peak[mid] > currentTime) HigherLimit = mid;
      else lowerLimit = mid + 1;
    }
    if (lowerLimit > 0) {
      while (peak[lowerLimit] - currentTime >= -0.0001 && lowerLimit > 0)
        lowerLimit -= 1;
      return peak[lowerLimit];
    }
    return 0;
  };

  const findPosNext = (currentTime) => {
    let lowerLimit = 0;
    let HigherLimit = peak.length;
    while (lowerLimit !== HigherLimit) {
      const mid = Math.floor((lowerLimit + HigherLimit) / 2);
      if (peak[mid] > currentTime) HigherLimit = mid;
      else lowerLimit = mid + 1;
    }
    if (Math.abs(peak[lowerLimit] - currentTime) < 0.00001) {
      return peak[lowerLimit + 1];
    }
    return peak[lowerLimit];
  };

  const clickLast = () => {
    wavesurfer.setCurrentTime(findPosLast(wavesurfer.getCurrentTime()));
    // let nextTime =
    //   Math.floor(wavesurfer.getCurrentTime() / interval - 0.001) * interval;
    // if (nextTime < 0) nextTime = 0;
    // console.log(nextTime);
    // wavesurfer.setCurrentTime(nextTime);
  };

  const clickLastbyBeat = () => {
    let nextTime =
      Math.floor(wavesurfer.getCurrentTime() / interval - 0.001) * interval;
    if (nextTime < 0) nextTime = 0;
    wavesurfer.setCurrentTime(nextTime);
  };

  const clickNext = () => {
    wavesurfer.setCurrentTime(findPosNext(wavesurfer.getCurrentTime()));
    // const nextTime =
    //   Math.ceil(wavesurfer.getCurrentTime() / interval + 0.001) * interval;
    // wavesurfer.setCurrentTime(nextTime);
  };

  const clickNextbyBeat = () => {
    const nextTime =
      Math.ceil(wavesurfer.getCurrentTime() / interval + 0.001) * interval;
    wavesurfer.setCurrentTime(nextTime);
  };

  const play = () => {
    wavesurfer.play();
  };

  return (
    <div className="Timeline">
      <div id="waveform" />
      <center>
        <button onClick={clickLastbyBeat} type="button">
          lastBeatPoint
        </button>
        <button onClick={clickLast} type="button">
          lastPeak
        </button>
        <button onClick={play} type="button">
          play
        </button>
        <button onClick={clickNext} type="button">
          nextPeak
        </button>
        <button onClick={clickNextbyBeat} type="button">
          nextBeatPoint
        </button>
      </center>
    </div>
  );
}

export default Timeline;
