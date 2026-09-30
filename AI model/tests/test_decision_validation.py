import unittest

from schemas import normalize_model_output


def sample_context(granularity: str = "unit", status: str = "PASS", requirement_type: str = "inbound_defect"):
    return {
        "unitId": "UNIT-1",
        "charges": [
            {
                "lineId": "CHG-1",
                "chargeType": "inbound_defect",
                "granularity": granularity,
                "chargedAt": "2026-09-01",
            }
        ],
        "evidence": [
            {
                "recordId": "EV-1",
                "status": status,
                "timestamp": "2026-08-31T08:00:00Z",
            }
        ],
        "requirements": [
            {"id": 7, "chargeType": requirement_type, "rule": "Only the supplied policy text.", "verified": True}
        ],
    }


class DecisionValidationTests(unittest.TestCase):
    def test_accepts_contested_only_with_cited_prior_pass_and_matching_rule(self):
        raw = '{"decisions":[{"chargeId":"CHG-1","verdict":"contested","reason":"Prior prep pass.","evidenceRecordIds":["EV-1"],"requirementIds":[7]}]}'

        decision = normalize_model_output(raw, sample_context())[0]

        self.assertEqual(decision["verdict"], "contested")

    def test_rejects_citation_not_in_input(self):
        raw = '{"decisions":[{"chargeId":"CHG-1","verdict":"contested","reason":"Pass.","evidenceRecordIds":["FAKE"],"requirementIds":[7]}]}'

        decision = normalize_model_output(raw, sample_context())[0]

        self.assertEqual(decision["verdict"], "insufficient_evidence")

    def test_rejects_non_unit_granularity_and_wrong_rule_type(self):
        raw = '{"decisions":[{"chargeId":"CHG-1","verdict":"contested","reason":"Pass.","evidenceRecordIds":["EV-1"],"requirementIds":[7]}]}'

        shipment_decision = normalize_model_output(raw, sample_context(granularity="shipment"))[0]
        wrong_rule_decision = normalize_model_output(raw, sample_context(requirement_type="lost_inbound"))[0]

        self.assertEqual(shipment_decision["verdict"], "insufficient_evidence")
        self.assertEqual(wrong_rule_decision["verdict"], "insufficient_evidence")

    def test_accepts_accepted_only_for_cited_fail(self):
        raw = '{"decisions":[{"chargeId":"CHG-1","verdict":"accepted","reason":"Required check failed.","evidenceRecordIds":["EV-1"],"requirementIds":[7]}]}'

        pass_result = normalize_model_output(raw, sample_context(status="PASS"))[0]
        fail_result = normalize_model_output(raw, sample_context(status="FAIL"))[0]

        self.assertEqual(pass_result["verdict"], "insufficient_evidence")
        self.assertEqual(fail_result["verdict"], "accepted")

    def test_malformed_json_fails_open(self):
        decision = normalize_model_output("not json", sample_context())[0]

        self.assertEqual(decision["verdict"], "insufficient_evidence")

    def test_unverified_policy_reference_allowed_by_default(self):
        raw = '{"decisions":[{"chargeId":"CHG-1","verdict":"contested","reason":"Prior pass.","evidenceRecordIds":["EV-1"],"requirementIds":[7]}]}'
        context = sample_context()
        context["requirements"][0]["verified"] = False

        decision = normalize_model_output(raw, context)[0]

        self.assertEqual(decision["verdict"], "contested")

    def test_unverified_policy_reference_can_be_disabled_explicitly(self):
        raw = '{"decisions":[{"chargeId":"CHG-1","verdict":"contested","reason":"Prior pass.","evidenceRecordIds":["EV-1"],"requirementIds":[7]}]}'
        context = sample_context()
        context["requirements"][0]["verified"] = False
        context["allowUnverifiedRules"] = False

        decision = normalize_model_output(raw, context)[0]

        self.assertEqual(decision["verdict"], "insufficient_evidence")


if __name__ == "__main__":
    unittest.main()