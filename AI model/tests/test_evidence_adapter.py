import unittest

from evidence_adapter import _rule_for, build_contexts


class EvidenceAdapterTests(unittest.TestCase):
    def test_builds_one_context_per_charge_with_upstream_evidence_and_rule_source(self):
        contexts = build_contexts()

        self.assertEqual(len(contexts), 8)
        unit_fourteen = next(item for item in contexts if item["unitId"] == "UNIT-0014")
        self.assertTrue(unit_fourteen["evidence"])
        self.assertEqual(unit_fourteen["requirements"][0]["chargeType"], "inbound_defect_fee")
        self.assertIn("sellercentral.amazon.com", unit_fourteen["requirements"][0]["rule"])
        self.assertFalse(unit_fourteen["requirements"][0]["verified"])

    def test_unknown_charge_type_is_insufficient_by_default(self):
        rule = _rule_for("unknown_charge")

        self.assertIn("No authoritative rule configured", rule["rule"])


if __name__ == "__main__":
    unittest.main()