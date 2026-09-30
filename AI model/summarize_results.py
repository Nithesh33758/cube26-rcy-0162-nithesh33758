"""Summarize local sample-analysis output without treating it as ground truth."""

from __future__ import annotations

import argparse
import json
from collections import Counter


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", nargs="?", default="sample_analysis_results.json")
    args = parser.parse_args()
    with open(args.path, encoding="utf-8") as stream:
        results = json.load(stream)
    verdicts = Counter(
        decision["verdict"]
        for result in results
        for decision in result.get("decisions", [])
    )
    print(json.dumps({"rows": len(results), "verdicts": dict(verdicts), "groundTruth": False}, indent=2))


if __name__ == "__main__":
    main()