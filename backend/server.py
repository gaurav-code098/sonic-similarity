from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sonic_engine # <--- The new Math Engine
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchQuery(BaseModel):
    query: str

@app.get("/")
def home():
    return {"status": "Sonic Math Engine Running"}

@app.post("/scan")
def scan_song(request: SearchQuery):
    print(f"--- NEW SEARCH: {request.query} ---")
    data = sonic_engine.get_track_data(request.query)
    
    if not data:
        raise HTTPException(status_code=404, detail="Could not analyze audio.")
        
    return data

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
