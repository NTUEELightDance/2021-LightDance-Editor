import React, { useState, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import regions from "wavesurfer.js/src/plugin/regions";
import Slider from "@material-ui/core/Slider";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Dialog from "@material-ui/core/Dialog";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
// import timeline from "wavesurfer.js/src/plugin/timeline";
// import soundfile from "./DJ-Memory-Welcome-To-The-Jungle.mp3";
// import soundfile from "./music.mp3";
import soundfile from "./asset/eenight.wav";

// import MediaElement from 'wavesurfer.js/src/mediaelement.js'

function wavesurferInitilize(check) {
  if (check === undefined) {
    const wavesurfer = WaveSurfer.create({
      container: "#waveform",
      scrollParent: true,
      plugins: [
        regions.create({
          regionsMinLength: 0,
        }),
        // timeline.create({
        //   container: "#wave-timeline",
        // }),
      ],
    });

    // wavesurfer.enableDragSelection({
    //   drag: false,
    //   slop: 1,
    //   loop: false,
    // });

    wavesurfer.load(soundfile);

    wavesurfer.on("ready", () => {
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
  const [musicbuffer, setMusicbuffer] = useState(null);
  const [interval, setInterval] = useState(60 / 144);
  const [peak, setPeak] = useState();
  const [start, setStart] = useState();
  const [end, setEnd] = useState();
  const [newStart, setNewStart] = useState();
  const [newEnd, setNewEnd] = useState();
  const [region, setRegion] = useState([]);
  const [regionNow, setRegionNow] = useState("None");
  const [ratio, setRatio] = useState(0);
  const [thrRatio, setThrRatio] = useState(10);
  const [DATA, setDATA] = useState();
  const [open, setOpen] = useState(false);
  const [filterNow, setFilterNow] = useState("lowpass");
  const upperBPM = 200;
  const lowerBPM = 90;

  let data = null;
  const dao = new (window.AudioContext || window.webkitAudioContext)();

  function getPeaksAtThreshold(
    musicdata,
    threashold,
    Subthreashold,
    originaldata
  ) {
    // console.log(threashold, Subthreashold);
    const peaksArray = [];
    // const Peaks = getPeaks(musicdata);
    const { length } = originaldata;
    // V1------------------------------------------------------------------
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
        i += 4410;
        findLower = false;
        // Skip forward ~ 1/4s to get past this peak.
      }
    }
    // V1 end--------------------------------------------------------------
    // V2 -----------------------------------------------------------------
    // let smallest = 10 ** -15;
    // for (let i = 0; i < length; i += 1) {
    //   if()
    // }
    // v2 end--------------------------------------------------------------
    return peaksArray;
  }

  function countIntervalsBetweenNearbyPeaks(peaks) {
    const intervals = [];
    peaks.forEach((Peak, index) => {
      for (let i = 0; i < 10; i += 1) {
        let int = 60 / (peaks[index + i] - Peak);
        if (int !== Infinity && int !== 0) {
          while (int < lowerBPM) int *= 2;
        }
        if (int <= upperBPM) intervals.push(Math.round(int));
      }
    });

    const intervalCounts = [];
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
        musicData.push(musicdata[i + 1] - musicdata[i]);
      else musicData.push(0);
    }
    for (let i = 0; i < musicdata.length; i += 1) mean += musicdata[i];
    const Threashold = (mean / musicdata.length) * thrRatio;
    const Subthreashold = mean / musicdata.length / 10000;
    return [musicData, Threashold, Subthreashold, musicdata];
  };

  const findPeakAndCountBPM = () => {
    const data2 = musicProcessing(DATA);
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

  function loadMusic(url, filterType) {
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
        filter.type = filterType;

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
          setMusicbuffer(filteredBuffer);
          data = filteredBuffer.getChannelData(0);
          setDATA(data);
        };
      });
    };
    request.send();
  }

  useEffect(() => {
    setPict(loadMusic(soundfile, "lowpass"));
    setWavesurfer(wavesurferInitilize(wavesurfer));
  }, []);

  useEffect(() => {
    if (DATA !== undefined) findPeakAndCountBPM(DATA);
  }, DATA);

  useEffect(() => {
    if (DATA !== undefined) {
      findPeakAndCountBPM(DATA);
    }
  }, [thrRatio, DATA]);

  // useEffect(() => {
  //   if (peak) {
  //     wavesurfer.clearRegions();
  //     for (let i = 0; i < peak.length; i += 1)
  //       wavesurfer.addRegion({
  //         start: peak[i],
  //         end: peak[i],
  //         loop: false,
  //         drag: false,
  //       });
  //   }
  // }, peak);

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
  };

  const clickNext = () => {
    wavesurfer.setCurrentTime(findPosNext(wavesurfer.getCurrentTime()));
  };

  const play = () => {
    wavesurfer.playPause();
  };

  const playRegion = () => {
    if (regionNow >= 0 && regionNow < region.length) {
      const Region = Object.values(wavesurfer.regions.list)[regionNow];
      Region.play();
    } else {
      const Region = Object.values(wavesurfer.regions.list)[0];
      Region.play();
    }
  };

  const handleChange = (event, newValue) => {
    setRatio(newValue);
    wavesurfer.zoom(
      (newValue * (window.screen.availWidth - wavesurfer.params.minPxPerSec)) /
        10
    );
  };

  const newRatio = (event, newValue) => {
    setThrRatio(newValue);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const updateRegion = (regionID) => {
    const Region = Object.values(wavesurfer.regions.list)[regionID];
    Region.update({ start: newStart, end: newEnd });
    const sub = region;
    sub[regionID].Start = newStart;
    sub[regionID].End = newEnd;
    setRegion(sub);
    setNewStart("");
    setNewEnd("");
  };

  const deleteRegion = (regionID) => {
    const Region = Object.values(wavesurfer.regions.list)[regionID];
    Region.remove();
    let sub = region;
    sub = sub.filter((item) => {
      return item.Value !== regionID;
    });
    for (let i = 0; i < sub.length; i += 1) {
      if (sub[i].Value > regionID) sub[i].Value -= 1;
    }
    setRegion(sub);
  };

  const Regions =
    region === []
      ? ""
      : region.map((r) => (
          <Accordion>
            <AccordionSummary
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography>Accordion {r.Value}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                id="standard-basic"
                label="Start"
                placeholder="start"
                value={newStart}
                onChange={(e) => {
                  setNewStart(e.target.value);
                }}
              />
              <TextField
                id="standard-basic"
                label="End"
                placeholder="end"
                value={newEnd}
                onChange={(e) => {
                  setNewEnd(e.target.value);
                }}
              />
              <Button
                color="primary"
                onClick={() => {
                  updateRegion(r.Value);
                }}
              >
                UPDATE
              </Button>
              <Button
                color="primary"
                onClick={() => {
                  deleteRegion(r.Value);
                }}
              >
                DELETE
              </Button>
              <Typography id="discrete-slider-small-steps" gutterBottom>
                Threashhold Ratio: {thrRatio}
              </Typography>
              <Slider
                defaultValue={thrRatio}
                max={25}
                min={5}
                step={1}
                onChange={newRatio}
                aria-labelledby="discrete-slider-small-steps"
                valueLabelDisplay="auto"
                marks
              />
            </AccordionDetails>
          </Accordion>
        ));

  const mySelect =
    region === []
      ? ""
      : region.map((r) => <MenuItem value={r.Value}>{r.Value}</MenuItem>);

  return (
    <div className="Timeline">
      <div id="waveform" />
      <center>
        <Button onClick={clickLast} color="primary">
          lastPeak
        </Button>
        <Button onClick={play} color="primary">
          play/pause
        </Button>
        <Button onClick={playRegion} color="primary">
          playRegion
        </Button>

        <Button onClick={clickNext} color="primary">
          nextPeak
        </Button>

        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={regionNow}
          onChange={(e) => {
            const v = e.target.value;
            setRegionNow(v);
            if (!Number.isNaN(v)) {
              const r = region.filter((item) => {
                return item.Value === v;
              });
              wavesurfer.setCurrentTime(r[0].Start);
              wavesurfer.zoom(
                window.screen.availWidth / (r[0].End - r[0].Start)
              );
            } else {
              wavesurfer.zoom();
            }
          }}
        >
          <MenuItem value="None">None</MenuItem>
          {mySelect}
        </Select>
      </center>
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Open Settings
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="max-width-dialog-title"
      >
        <DialogTitle id="max-width-dialog-title">Settings</DialogTitle>
        <DialogContent>
          {Regions}
          <div>
            <TextField
              id="standard-basic"
              label="Start"
              placeholder="start"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
              }}
            />
            <TextField
              id="standard-basic"
              label="End"
              placeholder="end"
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
              }}
            />
            <Button
              color="primary"
              onClick={() => {
                // setWavesurfer(wavesurferInitilize(wavesurfer, start, end));
                // wavesurfer.regions.update((start: start), (end: end));
                wavesurfer.addRegion({
                  start,
                  end,
                  loop: false,
                  color: "hsla(400, 100%, 30%, 0.5)",
                });

                setRegion([
                  ...region,
                  {
                    Start: start,
                    End: end,
                    Value: region.length,
                  },
                ]);

                setStart("");
                setEnd("");
              }}
            >
              add
            </Button>
            <TextField
              id="standard-basic"
              label="Zone"
              onChange={(e) => {
                const v = e.target.value;
                setRegionNow(v);
                if (
                  v < region.length &&
                  v >= 0 &&
                  !Number.isNaN(v) &&
                  v !== ""
                ) {
                  wavesurfer.setCurrentTime(region[v].Start);
                  wavesurfer.zoom(
                    window.screen.availWidth / (region[v].End - region[v].Start)
                  );
                } else {
                  wavesurfer.zoom();
                }
              }}
            />
            <Typography variant="subtitle1" gutterBottom>
              filter type
            </Typography>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={filterNow}
              onChange={(e) => {
                setFilterNow(e.target.value);
                loadMusic(soundfile, e.target.value);
              }}
            >
              <MenuItem value="lowpass">lowpass</MenuItem>
              <MenuItem value="highpass">highpass</MenuItem>
              <MenuItem value="notch">notch</MenuItem>
            </Select>

            {wavesurfer === undefined ? (
              ""
            ) : (
              <div>
                <Typography id="discrete-slider-small-steps" gutterBottom>
                  zoom: {ratio}
                </Typography>
                <Slider
                  defaultValue={0}
                  max={10}
                  // min={window.screen.availWidth / wavesurfer.getDuration()}
                  min={0}
                  step={1}
                  onChange={handleChange}
                  aria-labelledby="discrete-slider-small-steps"
                  valueLabelDisplay="auto"
                  marks
                />
                <Typography id="discrete-slider-small-steps" gutterBottom>
                  Threashhold Ratio: {thrRatio}
                </Typography>
                <Slider
                  defaultValue={thrRatio}
                  max={25}
                  min={5}
                  step={1}
                  onChange={newRatio}
                  aria-labelledby="discrete-slider-small-steps"
                  valueLabelDisplay="auto"
                  marks
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Timeline;
