# Phase 03 Deferred Items

- **03-06 (out of scope):** `test/perf-gate.test.js` CLI-rejected fixture test failed once during a full `npm test` run on Windows: `renameSync` of `_test/perf-gate-fixtures/cli-rejected` hit `EPERM`, so the gate deleted the folder and the test's "moved to ...rejected" message assertion failed. The file passes on its own (49/49) and on the next two full runs. Likely a transient file lock (indexer/antivirus) under parallel test processes. Possible fix: retry the rename, or accept the delete message in the test.
