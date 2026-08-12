# Quickstart Execution Record

The official Quickstart was executed with Node 22.13.0 and `@terminal3/t3n-sdk` 4.36.0. The unmodified sample first failed because the installed SDK requires a trust anchor. After adding `fetchTrustedManifest("testnet")` and passing the result as `trustAnchor`, the handshake completed, the authenticated DID matched the claimed DID, and the usage endpoint returned available test credits.

The working implementation is `app/quickstart.ts`. It reads the key from `T3N_API_KEY`, uses the signed trust manifest, and never writes credentials to disk. Sanitized evidence is in `logs/quickstart_retry_sanitized.log`.
