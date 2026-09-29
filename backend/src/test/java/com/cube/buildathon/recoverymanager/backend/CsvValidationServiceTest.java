package com.cube.buildathon.recoverymanager.backend;

import com.cube.buildathon.recoverymanager.backend.dto.CsvValidationResult;
import com.cube.buildathon.recoverymanager.backend.service.CsvValidationService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;

class CsvValidationServiceTest {

    private final CsvValidationService csvValidationService = new CsvValidationService();

    @Test
    void validatesRequiredColumnsAndParsesValidCsv() {
        String csv = String.join(System.lineSeparator(),
                "Line ID,Report Type,Unit Id,org id,sku,fnsku,fba shipment id,order id,charge type,Quantity,Ammount,posted date,notes",
                "FEE-0001,fee_report,UNIT-0001,org_demo_alpha,SKU-1,X00A1,FBA-100,ORD-100,fulfilment_fee_weight_tier,1,5.10,2026-06-23,ok"
        );

        MockMultipartFile file = new MockMultipartFile("file", "fee_report.csv", "text/csv", csv.getBytes());

        CsvValidationResult result = csvValidationService.validateCsv(file);

        assertThat(result.isValid()).isTrue();
        assertThat(result.getMissingColumns()).isEmpty();
        assertThat(result.getValidRows()).isEqualTo(1);
        assertThat(result.getInvalidRows()).isEqualTo(0);
        assertThat(result.getParsedRows()).singleElement().satisfies(row -> {
            assertThat(row.amount()).isEqualByComparingTo("5.10");
            assertThat(row.unitId()).isEqualTo("UNIT-0001");
        });
    }

    @Test
    void rejectsMissingColumns() {
        String csv = String.join(System.lineSeparator(),
                "Line ID,Report Type,Unit Id,org id,sku,fnsku,order id,charge type,Quantity,Ammount,posted date",
                "FEE-0001,fee_report,UNIT-0001,org_demo_alpha,SKU-1,X00A1,ORD-100,fulfilment_fee_weight_tier,1,5.10,2026-06-23"
        );

        MockMultipartFile file = new MockMultipartFile("file", "missing.csv", "text/csv", csv.getBytes());

        CsvValidationResult result = csvValidationService.validateCsv(file);

        assertThat(result.isValid()).isFalse();
        assertThat(result.getMissingColumns()).contains("fba shipment id");
    }

    @Test
    void identifiesInvalidAmountAndDate() {
        String csv = String.join(System.lineSeparator(),
                "Line ID,Report Type,Unit Id,org id,sku,fnsku,fba shipment id,order id,charge type,Quantity,Ammount,posted date",
                "FEE-0001,fee_report,UNIT-0001,org_demo_alpha,SKU-1,X00A1,FBA-100,ORD-100,fulfilment_fee_weight_tier,1,not-a-number,not-a-date"
        );

        MockMultipartFile file = new MockMultipartFile("file", "bad.csv", "text/csv", csv.getBytes());

        CsvValidationResult result = csvValidationService.validateCsv(file);

        assertThat(result.isValid()).isFalse();
        assertThat(result.getRowErrors()).anySatisfy(error -> {
            assertThat(error.getField()).isIn("Ammount", "posted date");
        });
    }

    @Test
    void acceptsCurrentSnakeCaseHeadersAndQuotedValues() {
        String csv = String.join(System.lineSeparator(),
                "line_id,report_type,unit_id,org_id,sku,fnsku,fba_shipment_id,order_id,charge_type,quantity,amount_usd,posted_date,notes",
                "FEE-0002,fee_report,UNIT-0002,org_demo_alpha,\"SKU,BLUE\",X00A2,FBA-101,ORD-101,fulfilment_fee_weight_tier,2,10.25,2026-06-24,\"note, with comma\""
        );

        MockMultipartFile file = new MockMultipartFile("file", "snake_case.csv", "text/csv", csv.getBytes());

        CsvValidationResult result = csvValidationService.validateCsv(file);

        assertThat(result.isValid()).isTrue();
        assertThat(result.getTotalRows()).isEqualTo(1);
        assertThat(result.getParsedRows()).singleElement().satisfies(row -> {
            assertThat(row.sku()).isEqualTo("SKU,BLUE");
            assertThat(row.amount()).isEqualByComparingTo("10.25");
        });
    }

    @Test
    void reportsRequiredValuesAndMalformedColumnCounts() {
        String csv = String.join(System.lineSeparator(),
                "line_id,report_type,unit_id,org_id,sku,fnsku,fba_shipment_id,order_id,charge_type,quantity,amount_usd,posted_date",
                ",fee_report,,org_demo_alpha,SKU-3,X00A3,FBA-102,ORD-102,fee,not-a-number,abc,not-a-date",
                "FEE-0004,fee_report,UNIT-0004,org_demo_alpha"
        );

        MockMultipartFile file = new MockMultipartFile("file", "invalid.csv", "text/csv", csv.getBytes());

        CsvValidationResult result = csvValidationService.validateCsv(file);

        assertThat(result.isValid()).isFalse();
        assertThat(result.getTotalRows()).isEqualTo(2);
        assertThat(result.getInvalidRows()).isEqualTo(2);
        assertThat(result.getRowErrors()).extracting("field")
                .contains("line_id", "unit_id", "quantity", "amount_usd", "posted_date", "row");
    }

    @Test
    void parsesNormalizedContractChargeSchemaAndShipmentGranularity() {
        String csv = String.join(System.lineSeparator(),
                "charge_id,charge_type,charge_subtype,charged_at,granularity,shipment_id,amazon_order_id,sku,fnsku,asin,quantity,currency,amount_per_unit,amount_total,description",
                "CHG-1,inbound_defect,unbagged_unit,2026-09-01,shipment,FBA-100,,SKU-1,FNSKU-1,ASIN-1,3,USD,2.50,7.50,Unplanned prep charge"
        );
        MockMultipartFile file = new MockMultipartFile("file", "charges.csv", "text/csv", csv.getBytes());

        CsvValidationResult result = csvValidationService.validateCsv(file);

        assertThat(result.isValid()).isTrue();
        assertThat(result.getParsedRows()).singleElement().satisfies(row -> {
            assertThat(row.lineId()).isEqualTo("CHG-1");
            assertThat(row.granularity()).isEqualTo("shipment");
            assertThat(row.fbaShipmentId()).isEqualTo("FBA-100");
            assertThat(row.amount()).isEqualByComparingTo("7.50");
            assertThat(row.amountPerUnit()).isEqualByComparingTo("2.50");
            assertThat(row.orgId()).isNull();
            assertThat(row.unitId()).isNull();
        });
    }
}
