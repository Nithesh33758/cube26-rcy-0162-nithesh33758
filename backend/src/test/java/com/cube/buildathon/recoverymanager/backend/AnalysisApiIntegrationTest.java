package com.cube.buildathon.recoverymanager.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AnalysisApiIntegrationTest {
    private static final String ORG_ALPHA = "org_demo_alpha";
    private static final String HEADER = "line_id,report_type,unit_id,org_id,sku,fnsku,fba_shipment_id,order_id,charge_type,quantity,amount_usd,posted_date";

    @Autowired
    private MockMvc mockMvc;

    @Test
        void uploadWaitsForExplicitStartAndReturnsPersistedInsufficientEvidenceResults() throws Exception {
        String csv = HEADER + "\n"
                + "API-100,fee_report,UNIT-API-1," + ORG_ALPHA + ",SKU-1,FNSKU-1,FBA-1,ORD-1,fee,1,5.10,2026-09-01\n"
                + "API-101,fee_report,UNIT-API-1," + ORG_ALPHA + ",SKU-2,FNSKU-2,FBA-1,ORD-2,fee,2,8.25,2026-09-02\n"
                + "API-102,fee_report,UNIT-API-2," + ORG_ALPHA + ",SKU-3,FNSKU-3,FBA-2,ORD-3,fee,1,2.00,2026-09-03";

        MvcResult uploadResult = upload(csv, ORG_ALPHA)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("VALIDATED"))
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.totalRows").value(3))
                .andExpect(jsonPath("$.validRows").value(3))
                .andExpect(jsonPath("$.invalidRows").value(0))
                .andReturn();
        String analysisId = analysisId(uploadResult);

        mockMvc.perform(get("/api/analysis/{analysisId}/status", analysisId)
                        .header("X-Org-Id", ORG_ALPHA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VALIDATED"))
                .andExpect(jsonPath("$.processedRows").value(0));

        mockMvc.perform(post("/api/analysis/{analysisId}/start", analysisId)
                        .header("X-Org-Id", ORG_ALPHA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.processedRows").value(3))
                .andExpect(jsonPath("$.percentage").value(100));

        mockMvc.perform(get("/api/analysis/{analysisId}", analysisId)
                        .header("X-Org-Id", ORG_ALPHA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.totalCharges").value(3))
                .andExpect(jsonPath("$.summary.claimsRecommended").value(0))
                .andExpect(jsonPath("$.summary.uncertain").value(3))
                .andExpect(jsonPath("$.summary.insufficientEvidence").value(3))
                .andExpect(jsonPath("$.charges[0].decision").value("INSUFFICIENT_EVIDENCE"));

        mockMvc.perform(get("/api/charges")
                        .param("analysisId", analysisId)
                        .param("unitId", "UNIT-API-1")
                        .header("X-Org-Id", ORG_ALPHA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/analysis/{analysisId}", analysisId)
                        .header("X-Org-Id", "org_demo_bravo"))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidRowsArePreservedAndOnlyMatchingOrganizationChargesAreStored() throws Exception {
        String csv = HEADER + "\n"
                + "API-200,fee_report,UNIT-API-3," + ORG_ALPHA + ",SKU-1,FNSKU-1,FBA-1,ORD-1,fee,1,5.10,2026-09-01\n"
                + "API-201,fee_report,UNIT-API-4," + ORG_ALPHA + ",SKU-2,FNSKU-2,FBA-1,ORD-2,fee,1,not-money,2026-09-02\n"
                + "API-202,fee_report,UNIT-API-5,org_demo_bravo,SKU-3,FNSKU-3,FBA-2,ORD-3,fee,1,2.00,2026-09-03";

        MvcResult uploadResult = upload(csv, ORG_ALPHA)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.headersValid").value(true))
                .andExpect(jsonPath("$.valid").value(false))
                .andExpect(jsonPath("$.totalRows").value(3))
                .andExpect(jsonPath("$.validRows").value(1))
                .andExpect(jsonPath("$.invalidRows").value(2))
                .andExpect(jsonPath("$.rowErrors[*].field", hasItem("amount_usd")))
                .andExpect(jsonPath("$.rowErrors[*].field", hasItem("org_id")))
                .andReturn();
        String analysisId = analysisId(uploadResult);

        mockMvc.perform(get("/api/analysis/{analysisId}", analysisId)
                        .header("X-Org-Id", ORG_ALPHA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.charges.length()").value(1))
                .andExpect(jsonPath("$.validationErrors.length()").value(2));

        mockMvc.perform(post("/api/analysis/{analysisId}/start", analysisId)
                        .header("X-Org-Id", ORG_ALPHA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.processedRows").value(1));
    }

    @Test
    void missingRequiredHeaderReturnsClearValidationResponse() throws Exception {
        String csv = "line_id,unit_id,org_id,quantity,amount_usd,posted_date\n"
                + "API-300,UNIT-API-6," + ORG_ALPHA + ",1,4.00,2026-09-04";

        upload(csv, ORG_ALPHA)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.headersValid").value(false))
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.missingColumns", hasItem("report_type")))
                .andExpect(jsonPath("$.missingColumns", not(hasItem("amount_usd"))));
    }

    @Test
    void importedCreditSuppressesAChargeItFullyCovers() throws Exception {
        String suffix = UUID.randomUUID().toString();
        String reimbursementCsv = "reimbursement_id,approval_date,amazon_order_id,sku,reason,currency,amount_per_unit,amount_total,quantity_reimbursed_cash,quantity_reimbursed_inventory\n"
                + "R-" + suffix + ",2026-09-01,ORD-" + suffix + ",SKU-1,warehouse lost,USD,5.00,5.00,1,0";
        MockMultipartFile reimbursementFile = new MockMultipartFile(
                "file", "reimbursements.csv", "text/csv", reimbursementCsv.getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/reimbursements/upload")
                        .file(reimbursementFile)
                        .header("X-Org-Id", ORG_ALPHA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importedRows").value(1));

        String chargeCsv = HEADER + "\n"
                + "CHG-" + suffix + ",fee_report,UNIT-" + suffix + "," + ORG_ALPHA
                + ",SKU-1,FNSKU-1,FBA-1,ORD-" + suffix + ",inbound_defect,1,5.00,2026-09-01";
        MvcResult uploadResult = upload(chargeCsv, ORG_ALPHA)
                .andExpect(status().isCreated())
                .andReturn();
        String analysisId = analysisId(uploadResult);

        mockMvc.perform(post("/api/analysis/{analysisId}/start", analysisId)
                        .header("X-Org-Id", ORG_ALPHA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        mockMvc.perform(get("/api/analysis/{analysisId}", analysisId)
                        .header("X-Org-Id", ORG_ALPHA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.alreadyReimbursed").value(1))
                .andExpect(jsonPath("$.charges[0].decision").value("ALREADY_REIMBURSED"));
    }

    private org.springframework.test.web.servlet.ResultActions upload(String csv, String orgId) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "api-test.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));
        return mockMvc.perform(multipart("/api/analysis/upload")
                .file(file)
                .header("X-Org-Id", orgId));
    }

    private String analysisId(MvcResult result) throws Exception {
        Matcher matcher = Pattern.compile("\"analysisId\"\\s*:\\s*\"([^\"]+)\"")
                .matcher(result.getResponse().getContentAsString());
        assertThat(matcher.find()).isTrue();
        return matcher.group(1);
    }
}
