# Stale revision errors must not use SQLSTATE 40001

The application uses optimistic revision checks to preserve newer work from another device. A stale revision is a business conflict, not a retryable database serialization failure.

PostgREST 14 retries a custom `40001` exception indefinitely. In production this exhausted the Nano database CPU, blocked other cloud reads and prevented phones from opening records. `save_teacher_records` now returns `PT409` with the existing `SYNC_CONFLICT` message. Account ownership checks, revision comparisons, grants, private files and final grades are unchanged.

For an existing installation apply `migrations/20261105_stop_conflict_retry.sql`. New installations use the corrected root `supabase-setup.sql`. Do not reintroduce `40001` in the RPC function. Client-side detection of legacy 40001 responses remains for compatibility and does not raise database exceptions.

Production verification on 2026-11-05:

- Compared full device backup and cloud document before resolving the stale revision. Classes, grades and all five paper file hashes matched. The cloud draft contained one additional selection, which was preserved. The local optical draft was retained by the archive migration.
- Ran a rolled-back SQL test that invokes the real function with the account identity and an impossible revision (-1). It catches only PT409 and fails if the error is absent or different. The test succeeded without updating records.
- Observed that the looping authenticator backend disappeared after the function replacement; no backend termination or project restart was necessary.
- Reloaded the application from cloud, observed its successful upload and subsequent **Bulut kayıtları güncel.** status.

Official diagnosis and mitigation: https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b
