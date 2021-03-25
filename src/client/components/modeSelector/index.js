import React, { useEffect, useContext, useState } from "react";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
// mui
import Button from "@material-ui/core/Button";
// redux selector and actions
import { selectGlobal, toggleMode } from "../../slices/globalSlice";
// constants
import { IDLE, ADD, EDIT } from "../../constants";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";

export default function ModeSelector({ handleSave, handleDelete, handelShift }) {
  // redux states
  const { mode } = useSelector(selectGlobal);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [timeShift, setTimeShift] = useState("");

  const dispatch = useDispatch();

  // mode
  const handleChangeMode = (m) => {
    dispatch(toggleMode(m));
  };

  const handelOpen = () => {
    setShiftOpen(true);
  };

  const handelClose = () => {
    setShiftOpen(false);
  };

  const requestShift = () => {
    handelShift(start, end, timeShift);
    setShiftOpen(false);
  };

  // keyDown to change mode (include multiple keyDown)
  const handleKeyDown = (e) => {
    if (e.code === "KeyE") handleChangeMode(EDIT);
    else if (e.code === "KeyA") handleChangeMode(ADD);
    else if (e.code === "KeyS" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.code === "Delete") handleDelete();
  };
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  return (
    <div>
      <Button
        variant="outlined"
        size="small"
        style={{
          backgroundColor: mode === EDIT ? "#505050" : "",
        }}
        onClick={() => handleChangeMode(EDIT)}
      >
        EDIT
      </Button>
      <Button
        variant="outlined"
        size="small"
        style={{
          backgroundColor: mode === ADD ? "#505050" : "",
        }}
        onClick={() => handleChangeMode(ADD)}
      >
        ADD
      </Button>
      <Button
        variant="outlined"
        size="small"
        color="primary"
        disabled={mode === IDLE}
        onClick={handleSave}
      >
        SAVE
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        onClick={handleDelete}
        disabled={mode !== IDLE}
      >
        DEL
      </Button>
      <Button
        onClick={handelOpen}
        size="small"
        variant="outlined"
        color="primary"
      >
        SHIFT
      </Button>
      <Dialog open={shiftOpen} onClose={handelClose}>
        <DialogTitle>Time Shift</DialogTitle>
        <DialogContent>
          <div>
            <TextField
              onChange={(e) => {
                setStart(e.target.value);
              }}
              label="start"
            />
          </div>
          <div>
            <TextField
              onChange={(e) => {
                setEnd(e.target.value);
              }}
              label="end"
            />
          </div>
          <div>
            <TextField
              onChange={(e) => {
                setTimeShift(e.target.value);
              }}
              label="shift"
            />
          </div>
          <div>
            <Button onClick={requestShift}>SHIFT</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

ModeSelector.propTypes = {
  handleSave: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired,
};
