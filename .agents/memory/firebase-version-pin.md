---
name: Firebase version pin
description: Firebase must stay at ^10.14.1 due to Replit security policy blocking v12+
---

The rule: keep `firebase` at `^10.14.1` in package.json. Do not run `npm install firebase@latest` or any upgrade.

**Why:** Firebase v12 depends on protobufjs which has a CVE flagged by Replit's security policy. The install is blocked at the platform level.

**How to apply:** If a future task asks to upgrade Firebase or if audit warnings appear about firebase, decline the upgrade and note this constraint.
