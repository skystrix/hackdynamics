# Runbook

## Reindex

- stop the writer
- run the backfill
- flip the alias

```bash
pocketrag reindex --since 2026-01-01
```

The flip is atomic.
