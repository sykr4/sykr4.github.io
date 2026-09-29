import test from "node:test";
import assert from "node:assert/strict";
import { videoEntry, rearmVideo, type VideoPhase } from "../src/lib/videoGate.ts";

// The 32 px interval is intentionally much shorter than a normal wheel gesture.
// These assertions express entry/exit behavior independently of rendering/media.
const scene = { top: 2400, end: 2432 };

test("a single large downward jump cannot bypass the entire video", () => {
  assert.equal(videoEntry("idle", 0, 9000, scene), 1);
});

test("a first visit from below captures even a jump past the entire video", () => {
  assert.equal(videoEntry("idle", 9000, 0, scene), -1);
});

test("ordinary movement that does not reach the scene remains free", () => {
  assert.equal(videoEntry("idle", 1200, 2399, scene), 0);
  assert.equal(videoEntry("idle", 5000, 2433, scene), 0);
  assert.equal(videoEntry("idle", 1200, 0, scene), 0);
  assert.equal(videoEntry("idle", 5000, 9000, scene), 0);
});

test("landing exactly on either entrance is a visit", () => {
  assert.equal(videoEntry("idle", 2000, scene.top, scene), 1);
  assert.equal(videoEntry("idle", 3000, scene.end, scene), -1);
});

test("starting exactly at a boundary does not leave a capture gap", () => {
  assert.equal(videoEntry("idle", scene.top, 6000, scene), 1);
  assert.equal(videoEntry("idle", scene.end, 0, scene), -1);
});

test("a scroll landing within the narrow interval captures in either direction", () => {
  assert.equal(videoEntry("idle", 2000, 2410, scene), 1);
  assert.equal(videoEntry("idle", 3000, 2420, scene), -1);
});

test("stationary observations and synthetic identical coordinates do not start playback", () => {
  for (const phase of ["idle", "forward", "reverse", "releasedDown", "releasedUp"] as VideoPhase[]) {
    for (const y of [0, scene.top, 2416, scene.end, 9000]) {
      assert.equal(videoEntry(phase, y, y, scene), 0);
    }
  }
});

test("End and Home projections still capture rather than bypassing the scene", () => {
  assert.equal(videoEntry("idle", 0, Number.POSITIVE_INFINITY, scene), 1);
  assert.equal(videoEntry("idle", 9000, Number.NEGATIVE_INFINITY, scene), -1);
});

test("an already playing scene cannot engage a second session", () => {
  for (const phase of ["forward", "reverse"] as VideoPhase[]) {
    assert.equal(videoEntry(phase, 0, 9000, scene), 0);
    assert.equal(videoEntry(phase, 9000, 0, scene), 0);
    assert.equal(videoEntry(phase, 2410, 2420, scene), 0);
  }
});

test("completion allows a legitimate exit without recapturing its release nudge", () => {
  assert.equal(videoEntry("releasedDown", scene.end, scene.end + 2, scene), 0);
  assert.equal(videoEntry("releasedDown", scene.end + 2, 9000, scene), 0);
  assert.equal(videoEntry("releasedUp", scene.top, scene.top - 2, scene), 0);
  assert.equal(videoEntry("releasedUp", scene.top - 2, 0, scene), 0);
});

test("immediate reversal after either completion opens a new visit", () => {
  assert.equal(videoEntry("releasedDown", scene.end + 2, 0, scene), -1);
  assert.equal(videoEntry("releasedUp", scene.top - 2, 9000, scene), 1);
  assert.equal(videoEntry("releasedDown", scene.end, scene.end - 1, scene), -1);
  assert.equal(videoEntry("releasedUp", scene.top, scene.top + 1, scene), 1);
});

test("release nudges and small boundary jitter do not rearm the same exit", () => {
  assert.equal(rearmVideo("releasedDown", scene.end + 2, scene), "releasedDown");
  assert.equal(rearmVideo("releasedDown", scene.end + 7, scene), "releasedDown");
  assert.equal(rearmVideo("releasedUp", scene.top - 2, scene), "releasedUp");
  assert.equal(rearmVideo("releasedUp", scene.top - 7, scene), "releasedUp");
});

test("a genuine exit rearms future visits while leaving outward scroll free", () => {
  const below = rearmVideo("releasedDown", 3000, scene);
  const above = rearmVideo("releasedUp", 1800, scene);
  assert.equal(below, "idle");
  assert.equal(above, "idle");
  assert.equal(videoEntry(below, 3000, 4000, scene), 0);
  assert.equal(videoEntry(above, 1800, 1000, scene), 0);
  assert.equal(videoEntry(below, 3000, 0, scene), -1);
  assert.equal(videoEntry(above, 1800, 9000, scene), 1);
});

test("downward and upward visits can repeat for multiple complete cycles", () => {
  let phase: VideoPhase = "idle";
  let captures = 0;
  for (let cycle = 0; cycle < 3; cycle += 1) {
    assert.equal(videoEntry(phase, 1000, 9000, scene), 1);
    captures += 1;
    phase = "releasedDown"; // The media player reports completion.
    assert.equal(videoEntry(phase, scene.end, 4000, scene), 0);
    phase = rearmVideo(phase, 4000, scene);
    assert.equal(videoEntry(phase, 4000, 0, scene), -1);
    captures += 1;
    phase = "releasedUp"; // Rewinding has reached the first frame.
    assert.equal(videoEntry(phase, scene.top, 1000, scene), 0);
    phase = rearmVideo(phase, 1000, scene);
  }
  assert.equal(captures, 6);
  assert.equal(phase, "idle");
});

test("capture follows current geometry after resize, including a zero-width interval", () => {
  const moved = { top: 5800, end: 5832 };
  assert.equal(videoEntry("idle", 0, 3000, moved), 0);
  assert.equal(videoEntry("idle", 3000, 7000, moved), 1);
  assert.equal(videoEntry("idle", 7000, 3000, moved), -1);
  const collapsed = { top: 3000, end: 3000 };
  assert.equal(videoEntry("idle", 0, 9000, collapsed), 1);
  assert.equal(videoEntry("idle", 9000, 0, collapsed), -1);
});
