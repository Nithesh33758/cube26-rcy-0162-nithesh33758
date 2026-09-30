from typing import Any

from fastapi import FastAPI, HTTPException

from model_runtime import LocalModelRuntime


runtime = LocalModelRuntime()
app = FastAPI(title="Recovery Manager Local AI", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "model": runtime.model_id,
        "loaded": runtime.loaded,
        "device": runtime.device,
    }


@app.post("/v1/analyze-unit")
def analyze_unit(context: dict[str, Any]) -> dict[str, Any]:
    try:
        return {"decisions": runtime.analyze_unit(context)}
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail="Local model unavailable; review required") from error