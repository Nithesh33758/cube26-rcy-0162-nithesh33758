package com.cube.buildathon.recoverymanager.backend;

import com.cube.buildathon.recoverymanager.backend.dto.ParsedReimbursementRow;
import com.cube.buildathon.recoverymanager.backend.service.ReimbursementCsvParser;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReimbursementCsvParserTest {
    private final ReimbursementCsvParser parser = new ReimbursementCsvParser();

    @Test
    void parsesContractFieldsAndPreservesMeaningfulNullIdentifiers() {
        String csv = "reimbursement_id,case_id,approval_date,amazon_order_id,sku,fnsku,asin,reason,condition,currency,amount_per_unit,amount_total,quantity_reimbursed_cash,quantity_reimbursed_inventory,original_reimbursement_id\n"
                + "R-1,,2026-09-01,,SKU-1,FNSKU-1,ASIN-1,warehouse lost,SELLABLE,USD,4.25,8.50,2,0,";
        MockMultipartFile file = new MockMultipartFile("file", "credits.csv", "text/csv", csv.getBytes());

        ParsedReimbursementRow row = parser.parse(file).getFirst();

        assertThat(row.reimbursementId()).isEqualTo("R-1");
        assertThat(row.caseId()).isNull();
        assertThat(row.amazonOrderId()).isNull();
        assertThat(row.originalReimbursementId()).isNull();
        assertThat(row.amountTotal()).isEqualByComparingTo("8.50");
        assertThat(row.quantityReimbursedCash()).isEqualTo(2);
    }

    @Test
    void rejectsInvalidDatesAndNegativeQuantities() {
        String headers = "reimbursement_id,approval_date,sku,reason,currency,amount_per_unit,amount_total,quantity_reimbursed_cash,quantity_reimbursed_inventory\n";
        MockMultipartFile badDate = new MockMultipartFile("file", "bad.csv", "text/csv",
                (headers + "R-1,not-a-date,SKU-1,lost,USD,1.00,1.00,1,0").getBytes());
        MockMultipartFile badQuantity = new MockMultipartFile("file", "bad.csv", "text/csv",
                (headers + "R-1,2026-09-01,SKU-1,lost,USD,1.00,1.00,-1,0").getBytes());

        assertThatThrownBy(() -> parser.parse(badDate)).hasMessageContaining("ISO format");
        assertThatThrownBy(() -> parser.parse(badQuantity)).hasMessageContaining("non-negative integers");
    }
}