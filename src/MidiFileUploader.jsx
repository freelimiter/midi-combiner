import React, { useRef, useState } from "react";
import { Midi } from "@tonejs/midi";
import { saveAs } from "file-saver";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, file, index, onRemove, onRepeatChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 12,
        background: isDragging ? "#e0f7fa" : "#f6fafd",
        borderRadius: 8,
        padding: 8,
        transition,
        transform: CSS.Transform.toString(transform),
        boxShadow: isDragging ? "0 2px 10px #2ec" : undefined,
        cursor: "grab",
      }}
    >
      <span
        style={{
          fontSize: 20,
          marginRight: 10,
          cursor: "grab",
          userSelect: "none",
        }}
        title="Drag to reorder"
      >
        ☰
      </span>
		<span
		  className="filename"
		  title={file.name}
		  style={{
			flex: 1,
			maxWidth: "1000px",       // or adjust to your UI needs
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
			display: "inline-block",
			verticalAlign: "middle",
			cursor: "pointer",
		  }}
		>
		  {index + 1}. {file.name}
		</span>	

      <label style={{ marginRight: 8 }}>
        Repeat:
        <input
          type="number"
          min={1}
          value={file.repeat}
          onChange={(e) => onRepeatChange(id, e.target.value)}
          style={{
            width: 48,
            marginLeft: 4,
            fontSize: 14,
            borderRadius: 4,
            border: "1px solid #ccc",
            padding: "2px 4px",
          }}
        />
      </label>
      <button
        onClick={() => onRemove(id)}
        style={{
          background: "#f55",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: 28,
          height: 28,
          fontWeight: "bold",
          fontSize: 18,
          cursor: "pointer",
        }}
        title="Remove file"
      >
        ×
      </button>
    </li>
  );
}

function MidiFileUploader() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const validateMidiFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      new Midi(arrayBuffer);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleFilesAdded = async (fileList) => {
    setError("");
    const allFiles = Array.from(fileList).filter(
      (f) =>
        f.type === "audio/midi" ||
        f.type === "audio/x-midi" ||
        f.name.toLowerCase().endsWith(".mid") ||
        f.name.toLowerCase().endsWith(".midi")
    );

    let validMidiFiles = [];
    let errors = [];

    for (let file of allFiles) {
      const isValid = await validateMidiFile(file);
      if (isValid) {
        validMidiFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          repeat: 1,
        });
      } else {
        errors.push(`File "${file.name}" is not a valid MIDI file.`);
      }
    }

    if (validMidiFiles.length > 0) {
      setFiles((prev) => [...prev, ...validMidiFiles]);
    }
    if (errors.length > 0) {
      setError(errors.join("\n"));
    }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesAdded(e.dataTransfer.files);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRepeatChange = (id, value) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, repeat: Math.max(1, parseInt(value) || 1) }
          : f
      )
    );
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);
      setFiles((files) => arrayMove(files, oldIndex, newIndex));
    }
  };

  // --- Combine & Export Logic ---
  //const TARGET_PPQ = 480;

//start
	const handleCombineAndExport = async () => {
	  setError("");
	  if (files.length === 0) {
		setError("No MIDI files to combine!");
		return;
	  }

	  try {
		let combinedMidi = new Midi();

		// Use tempo & time signature from the first file only
		let initialTempoEvents = [];
		let initialTimeSignatures = [];
		let usedInitial = false;

		let currentTick = 0;

		for (const f of files) {
		  console.log("Processing file:", f.name);
		  const arrayBuffer = await f.file.arrayBuffer();
		  const midi = new Midi(arrayBuffer);

		  if (!usedInitial) {
			initialTempoEvents = midi.header.tempos || [];
			initialTimeSignatures = midi.header.timeSignatures || [];
			usedInitial = true;
		  }

		  const sourcePPQ = midi.header.ppq || 480;
		  const tickRatio = combinedMidi.header.ppq / sourcePPQ;

		  for (let repeat = 0; repeat < f.repeat; repeat++) {
			console.log("Repeat #", repeat + 1, "for file", f.name);

			midi.tracks.forEach((track, trackIdx) => {
			  while (combinedMidi.tracks.length <= trackIdx) {
				combinedMidi.addTrack();
			  }
			  let combinedTrack = combinedMidi.tracks[trackIdx];

			  combinedTrack.name = "Tracks";

			  // Notes
			  console.log("Notes");
			  console.log("track.notes type:", typeof track.notes, "isArray:", Array.isArray(track.notes), "length:", track.notes.length);
			  
				track.notes.forEach((note, idx) => {
				  combinedTrack.addNote({
					midi: note.midi,
					velocity: note.velocity,
					noteOffVelocity: note.noteOffVelocity,
					ticks: Math.round(note.ticks * tickRatio) + currentTick,
					durationTicks: note.durationTicks
				  });
				});



			  // CC
			  console.log("CC");
			  if (track.controlChanges) {
				Object.values(track.controlChanges).forEach((ccArr) => {
				  ccArr.forEach((cc) => {
					combinedTrack.addCC({
					  ...cc,
					  ticks: Math.round(cc.ticks * tickRatio) + currentTick,
					  time: undefined,
					});
				  });
				});
			  }

			  // Pitch Bends
			  console.log("Pitch Bends");
			  
			  if (track.pitchBends) {
				track.pitchBends.forEach((pb) => {
				  combinedTrack.addPitchBend({
					...pb,
					ticks: Math.round(pb.ticks * tickRatio) + currentTick,
					time: undefined,
				  });
				});
			  }
			});

			// Advance tick: use the largest end tick for this MIDI (across all tracks)
  		    console.log("Advance tick: use the largest end tick for this MIDI (across all tracks)");
			let maxTicks = 0;
			midi.tracks.forEach((track) => {
			  track.notes.forEach((note) => {
				const endTick = Math.round((note.ticks + note.durationTicks) * tickRatio);
				if (endTick > maxTicks) maxTicks = endTick;
			  });
			});

			console.log("maxTicks for repeat #", repeat + 1, "is", maxTicks);

			if (maxTicks === 0) {
			  setError("No notes found in file or could not advance ticks for file: " + f.name);
			  return;
			}

			currentTick += maxTicks;
		  }
		}

		// Set tempo and time signature from first file
		combinedMidi.header.tempos = initialTempoEvents.map((ev) => ({
		  ...ev,
		  ticks: 0,
		}));
		combinedMidi.header.timeSignatures = initialTimeSignatures.map((ev) => ({
		  ...ev,
		  ticks: 0,
		}));

		// --- Robust Export ---
		let midiArray = combinedMidi.toArray();
		let uint8;

		if (midiArray instanceof Uint8Array) {
		  uint8 = midiArray;
		} else {
		  uint8 = Uint8Array.from(midiArray);
		}

		// Always create a new, tightly packed ArrayBuffer
		const safeBuffer = new ArrayBuffer(uint8.length);
		const safeView = new Uint8Array(safeBuffer);
		safeView.set(uint8);

		const midiBlob = new Blob([safeBuffer], { type: "audio/midi" });
		saveAs(midiBlob, "combined.mid");

	  } catch (err) {
		console.error("Combine/export ERROR:", err);
		setError("Error during combining/export: " + (err && err.message ? err.message : String(err)));
	  }
	};




  return (
    <div
      style={{
        maxWidth: 820,
        margin: "auto",
        padding: 24,
        fontFamily: "sans-serif",
      }}
    >
      <h2>MIDI File Uploader</h2>
      {error && (
        <div
          style={{
            background: "#ffd7d7",
            color: "#b20000",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            whiteSpace: "pre-line",
          }}
        >
          {error}
        </div>
      )}
      {/* Upload area */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{
          border: "2px dashed #ccc",
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
          marginBottom: 24,
          background: "#fafcff",
          cursor: "pointer",
        }}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mid,.midi,audio/midi,audio/x-midi"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFilesAdded(e.target.files)}
        />
        <div style={{ fontSize: 20, color: "#333" }}>
          Drag & drop MIDI files here<br />or<br />
          <button
            type="button"
            style={{
              marginTop: 12,
              padding: "8px 16px",
              fontSize: 16,
              borderRadius: 8,
              border: "1px solid #999",
              background: "#f3f3f3",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current.click();
            }}
          >
            Browse Files
          </button>
        </div>
      </div>
      {/* Uploaded files list with DnD */}
      {files.length > 0 && (
        <div>
          <h4>Uploaded Files (drag to reorder):</h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={files.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {files.map((f, idx) => (
                  <SortableItem
                    key={f.id}
                    id={f.id}
                    file={f}
                    index={idx}
                    onRemove={removeFile}
                    onRepeatChange={handleRepeatChange}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button
              onClick={handleCombineAndExport}
              style={{
                padding: "12px 24px",
                fontSize: 16,
                borderRadius: 8,
                border: "1px solid #1a7",
                background: "#c9ffe1",
                color: "#065",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Combine & Export as MIDI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MidiFileUploader;
