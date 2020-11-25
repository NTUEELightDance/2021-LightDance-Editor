import React, { useState, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import soundfile from "./music.mp3";

function Timeline() {
  const [wavesurfer, setWavesurfer] = useState();

  useEffect(() => {
    setWavesurfer(wavesurferInitilize(wavesurfer));
  });

  const play = () => {
    wavesurfer.play();
  };

  return (
    <div className="Timeline">
      <div id="waveform"></div>
      <button onClick={() => play()}>Play</button>
    </div>
  );
}

function wavesurferInitilize(check) {
  if (check === undefined) {
    const wavesurfer = WaveSurfer.create({
      container: "#waveform",
      scrollParent: true,
    });
    wavesurfer.load(soundfile);
    return wavesurfer;
  } else return check;
}

export default Timeline;
