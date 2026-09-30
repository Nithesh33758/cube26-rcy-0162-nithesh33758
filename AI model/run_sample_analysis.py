"""Run all supplied synthetic fee rows through the local model service."""

from __future__ import annotations

import argparse
import json
import urllib.request
from collections import Counter

from evidence_adapter import build_contexts


def analyze(base_url: str) -> list[dict]:
    results = []
    for context in build_contexts():
        request = urllib.request.Request(
            f"{base_url.rstrip('/')}/v1/analyze-unit",
            data=json.dumps(context).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=180) as response:
            body = json.loads(response.read().decode("utf-8"))
        results.append({"unitId": context["unitId"], "chargeId": context["charges"][0]["lineId"], **body})
    return results


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8090")
    parser.add_argument("--output", default="sample_analysis_results.json")
    args = parser.parse_args()
    results = analyze(args.url)
    with open(args.output, "w", encoding="utf-8") as stream:
        json.dump(results, stream, indent=2)
    verdicts = Counter(item["decisions"][0]["verdict"] for item in results if item.get("decisions"))
    print(json.dumps({"rows": len(results), "verdicts": verdicts}, default=dict))


if __name__ == "__main__":
    main()