package com.cube.buildathon.recoverymanager.backend.integration;

import java.util.Locale;

public enum EvidenceContractAgent {
    RECEIVING,
    PREP,
    PACK,
    RETURNS;

    public String apiValue() {
        return name().toLowerCase(Locale.ROOT);
    }
}