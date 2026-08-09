# Deterministic synthetic data generator

`generate.py` uses the Python standard library only. It has a fixed random seed
and fixed clock, performs no network access, writes each operational dataset to
its own JSON file, and creates `data/manifest.json` with SHA-256 checksums and
record counts.

Run from the project root:

```powershell
python .\tools\data-generator\generate.py
```

Every operational dataset contains at least 100 records. The generator refuses
to finish if account balances do not reconcile, if transfer/payment references
are broken, or if command/sandbox fixtures indicate real execution.

