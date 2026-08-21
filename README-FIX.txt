SCENTORY v0.5.0 — corrected deploy patch

The Cloudflare error happened because wrangler.jsonc points to:
src/index-v050.js

The v0.5 adapter also imports:
./index.js

Your repository currently has index-v050.js, but src/index.js is missing.

Upload these files with the exact names and paths:
- src/index.js
- src/index-v050.js
- wrangler.jsonc

Important:
- The extension .js must be present.
- Do not place the files in the repository root.
- They must be inside the src folder.
- A file named src/index-v050 without .js can be deleted; it is not used.

After commit, trigger/retry the Cloudflare deployment.
