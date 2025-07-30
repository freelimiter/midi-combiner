// src/BeatBuddyDescription.jsx
import React from "react";

export default function BeatBuddyDescription() {
  return (
    <div style={{ marginTop: 40, fontSize: 15 }}>
      <h2>BeatBuddy MIDI Combiner</h2>
      <p>
        <strong>BeatBuddy MIDI Combiner</strong> is a powerful, easy-to-use web app built especially for BeatBuddy musicians, pedal users, and song creators.<br />
        Upload your BeatBuddy MIDI part files—<em>each with their own tracks</em>—and seamlessly combine them into a single, ready-to-load multi-part MIDI song file.
      </p>
      <h3>How It Works</h3>
      <ol>
        <li>
          <strong>Upload MIDI Part Files:</strong><br />
          Drag and drop your BeatBuddy part MIDIs (Intro, Main, Fill, Outro, etc.), or select them from your device.
        </li>
        <li>
          <strong>Reorder &amp; Customize:</strong><br />
          Arrange the order of your MIDI files using drag-and-drop.<br />
          For each part, choose how many times it should repeat in your final song.
        </li>
        <li>
          <strong>Combine and Download:</strong><br />
          With one click, the app merges <em>all tracks and events from all files</em> in your selected order and repetitions.<br />
          The combined multi-track MIDI file is ready to import into BeatBuddy Manager or use with your pedal.
        </li>
      </ol>
      <h3>Who Is This For?</h3>
      <ul>
        <li><strong>BeatBuddy users &amp; song creators:</strong> Merge and arrange drum parts, fills, and song sections easily—no DAW needed.</li>
        <li><strong>Drummers &amp; musicians:</strong> Build custom songs and practice tracks for BeatBuddy pedals.</li>
        <li><strong>Anyone with multi-track MIDI files:</strong> Easily combine, reorder, and export for use in hardware or DAWs.</li>
      </ul>
      <p>
        <em>Everything runs locally in your browser—no upload, no sign-up, no install.<br />
        Works on any modern computer or tablet.</em>
      </p>
      <p>
        <strong>Ready to build your custom BeatBuddy MIDI song? Try the BeatBuddy MIDI Combiner now!</strong>
      </p>
    </div>
  );
}
