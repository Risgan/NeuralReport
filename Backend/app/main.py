from fastapi import FastAPI

app = FastAPI(title="NeuralReport API", version="0.1.0")


@app.get("/health")
def health() -> dict:
	return {"status": "ok"}

@app.get("/health2")
def health2() -> dict:
	return {"status": "ok"}