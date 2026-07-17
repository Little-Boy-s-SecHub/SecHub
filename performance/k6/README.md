# SecHub k6

Run from the repository root:

```powershell
k6 run performance/k6/smoke.js
k6 run -e VUS=20 performance/k6/load.js
k6 run performance/k6/stress.js
# Or use the Windows runner:
.\performance\run-k6.ps1 -Profile load -Vus 20
```

Configuration variables: `BASE_URL`, `K6_USERNAME`, `K6_PASSWORD`, and `VUS`. The scripts only load read-only learner/catalog endpoints; they do not start containers, submit flags, or create AI labs.

Default SLOs:

- Error rate below 1% for smoke/load and below 3% for stress.
- Catalog p95 below 400 ms.
- Dashboard p95 below 600 ms.
- Growth p95 below 800 ms.
