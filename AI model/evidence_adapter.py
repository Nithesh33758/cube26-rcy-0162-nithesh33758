"""Build model contexts from the supplied synthetic Recovery Manager CSVs.

The upstream files are pod-specific fixtures, not the official shared evidence
contract. This adapter is intentionally isolated so it can be replaced when
the organizers provide that contract.
"""

from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
UPSTREAM = ROOT / "data" / "upstream"
CHARGE_FILE = ROOT / "data" / "sample_input.csv"
AMAZON_RULES_FILE = Path(__file__).resolve().parent / "amazon_rules.json"

RULES: dict[str, dict[str, Any]] = {
    "inbound_defect_fee": {
        "rule_id": 1001,
        "name": "Inbound defect evidence mapping",
        "source": "recovery-data-contract.md section 6; Amazon policy source required before production",
        "checks": {
            "polybag_present": "prep",
            "suffocation_warning_present": "prep",
            "suffocation_warning_legible": "prep",
            "fnsku_label_flat": "prep",
            "fnsku_label_placement_valid": "prep",
            "manufacturer_barcode_covered": "prep",
        },
    },
    "lost_inbound": {
        "rule_id": 1002,
        "name": "Lost inbound evidence mapping",
        "source": "recovery-data-contract.md section 6; Amazon policy source required before production",
        "checks": {"quantity_matches_po": "receiving", "identity_matches_po": "receiving"},
    },
    "damaged_in_warehouse": {
        "rule_id": 1003,
        "name": "Warehouse damage evidence mapping",
        "source": "recovery-data-contract.md section 6; Amazon policy source required before production",
        "checks": {"unit_undamaged": "receiving", "prep_record_present": "prep"},
    },
    "refund_issued_item_not_returned": {
        "rule_id": 1004,
        "name": "Return evidence mapping",
        "source": "recovery-data-contract.md section 6; Amazon policy source required before production",
        "checks": {"identity_matches_order": "returns", "completeness_verified": "returns"},
    },
    "fulfilment_fee_weight_tier": {
        "rule_id": 1005,
        "name": "FBA fulfilment fee weight tier review",
        "source": "Amazon FBA packaging and measurement guidelines",
        "checks": {
            "fnsku_label_flat": "prep",
            "fnsku_label_placement_valid": "prep",
            "polybag_present": "prep",
            "carton_undamaged": "receiving",
            "unit_undamaged": "receiving",
        },
    },
}


def _amazon_rules() -> dict[str, dict[str, Any]]:
    """Load versioned Amazon references without treating unverified pages as policy."""
    with AMAZON_RULES_FILE.open(encoding="utf-8") as stream:
        catalog = json.load(stream)
    return {item["charge_type"]: item for item in catalog.get("rules", [])}


def _rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as stream:
        return list(csv.DictReader(stream))


def _date(value: str | None) -> str | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).isoformat()


def _status(value: str | None, positive: set[str], negative: set[str]) -> str:
    normalized = (value or "").strip().lower()
    if normalized in positive:
        return "PASS"
    if normalized in negative:
        return "FAIL"
    return "UNCERTAIN"


def _evidence(record: dict[str, str], source: str, key: str, value: str | None) -> dict[str, Any]:
    positive = {"yes", "true", "present", "sealed", "legible", "flat", "on_seam", "all_present", "restock", "not_required"}
    negative = {"no", "false", "none", "not_sealed", "missing", "uncertain", "liquidate", "dispose"}
    return {
        "recordId": f"{record['record_id']}:{key}",
        "sourceType": source.upper(),
        "requirement": key,
        "status": _status(value, positive, negative),
        "finding": f"Fixture value for {key}: {value or 'missing'}",
        "timestamp": _date(record.get("captured_at")),
    }


def _pod_evidence(unit_id: str) -> list[dict[str, Any]]:
    records: list[dict[str, str]] = []
    for filename in ("receiving_sample.csv", "prep_sample.csv", "pack_sample.csv", "returns_sample.csv"):
        records.extend(row for row in _rows(UPSTREAM / filename) if row.get("unit_id") == unit_id)

    evidence: list[dict[str, Any]] = []
    for record in records:
        source = "receiving" if record["record_id"].startswith("RCV") else record["record_id"][:3]
        source = {"RCV": "receiving", "PRP": "prep", "PCK": "pack", "RTN": "returns"}.get(source, source)
        if source == "prep":
            fields = {
                "polybag_present": record.get("polybag_present_sealed"),
                "polybag_sealed": record.get("polybag_present_sealed"),
                "suffocation_warning_present": record.get("suffocation_warning"),
                "suffocation_warning_legible": record.get("suffocation_warning"),
                "fnsku_label_flat": record.get("fnsku_label_placement"),
                "fnsku_label_placement_valid": record.get("fnsku_label_placement"),
                "manufacturer_barcode_covered": record.get("original_barcode_covered"),
            }
        elif source == "receiving":
            fields = {
                "identity_matches_po": record.get("identity_match"),
                "quantity_matches_po": "yes" if record.get("qty_ordered") == record.get("qty_received") else "no",
                "carton_undamaged": record.get("carton_damage"),
                "unit_undamaged": record.get("unit_damage"),
            }
        elif source == "pack":
            fields = {
                "all_items_present": "yes" if record.get("order_lines") == record.get("observed_in_box") else "no",
                "quantities_correct": "yes" if record.get("order_lines") == record.get("observed_in_box") else "no",
                "order_matches_manifest": record.get("operator_verdict"),
            }
        else:
            fields = {
                "identity_matches_order": record.get("identity_match"),
                "completeness_verified": "no" if record.get("parts_missing") else "yes",
                "condition_grade": record.get("amazon_condition") or record.get("observed_state"),
                "disposition_assigned": record.get("operator_disposition"),
            }
        evidence.extend(_evidence(record, source, key, value) for key, value in fields.items())
    return evidence


def _rule_for(charge_type: str) -> dict[str, Any]:
    rule = RULES.get(charge_type, {
        "rule_id": 1999,
        "name": "No contract mapping available",
        "source": "No authoritative rule configured",
        "checks": {},
    })
    amazon_rule = _amazon_rules().get(charge_type)
    if amazon_rule is None:
        return {
            "id": rule["rule_id"],
            "name": rule["name"],
            "description": "No Amazon policy catalog entry is available.",
            "chargeType": charge_type,
            "rule": "No authoritative rule configured",
            "verified": False,
        }
    return {
        "id": rule["rule_id"],
        "name": amazon_rule["name"],
        "description": "Contract mapping linked to an Amazon source; policy text still requires verification.",
        "chargeType": charge_type,
        "rule": f"{amazon_rule.get('rule_text', '')} Sources: {amazon_rule['source_url']}; linked policy: {', '.join(amazon_rule['linked_policy_urls'])}",
        "verified": bool(amazon_rule.get("verified", False)),
    }


def build_contexts(charge_file: Path = CHARGE_FILE) -> list[dict[str, Any]]:
    contexts: list[dict[str, Any]] = []
    for row in _rows(charge_file):
        charge_type = row["charge_type"]
        contexts.append({
            "unitId": row["unit_id"],
            "charges": [{
                "lineId": row["line_id"],
                "chargeType": charge_type,
                "quantity": int(row["quantity"]),
                "amount": float(row["amount_usd"]),
                "postedDate": row["posted_date"],
                "sku": row["sku"],
                "fnsku": row["fnsku"],
                "fbaShipmentId": row["fba_shipment_id"],
                "orderId": row["order_id"] or None,
                "chargeSubtype": charge_type,
                "granularity": "unit",
                "shipmentId": row["fba_shipment_id"],
                "currency": "USD",
                "chargedAt": row["posted_date"],
            }],
            "evidence": _pod_evidence(row["unit_id"]),
            "requirements": [_rule_for(charge_type)],
        })
    return contexts