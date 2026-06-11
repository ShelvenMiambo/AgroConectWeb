---
name: npm install ENOTEMPTY quirk
description: npm install fails with ENOTEMPTY on this Replit project; fix is full node_modules removal
---

The rule: When `npm install` fails with `ENOTEMPTY: directory not empty, rename ...`, do a full clean reinstall.

```bash
rm -rf node_modules && npm install
```

**Why:** Replit's filesystem has a race condition or stale lock files in node_modules that cause npm's atomic rename to fail. Partial cleanup (removing just the conflicting dirs) doesn't reliably fix it.

**How to apply:** Any time npm install errors with ENOTEMPTY, skip partial fixes and go straight to full removal.
