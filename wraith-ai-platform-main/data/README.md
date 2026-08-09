# Synthetic seed data

All files in `seed/` are deterministic, fictional, and limited to this local
demo. Identities, credentials, institutions, cards, domains, IP addresses,
files, and attacks are not real. IPs use RFC 5737 documentation networks;
domains use reserved `.example`, `.test`, or local-only names.

`manifest.json` is the integrity contract. It records the generator seed,
minimum row count, reconciliation totals, per-file row counts, and SHA-256
checksums. The API refuses readiness when an operational seed file no longer
matches this manifest.

`seed/demo_credentials.json` intentionally contains four clear-text fictional
passwords for local UI demonstrations. It is not exposed by the API and must
never be reused outside this local demo.
