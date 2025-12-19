from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import shutil
import pipeline
import engine
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler, MinMaxScaler

app = FastAPI()

# --- CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve songs static folder
if not os.path.exists("songs"):
    os.makedirs("songs")
app.mount("/songs", StaticFiles(directory="songs"), name="songs")

class SearchQuery(BaseModel):
    query: str

@app.post("/scan")
def scan_song(request: SearchQuery):
    user_query = request.query
    print(f"\n--- NEW SEARCH: {user_query} ---")

    # 1. CLEANUP (Delete old songs to save space/memory)
    folder = pipeline.DOWNLOAD_FOLDER
    if os.path.exists(folder):
        try:
            shutil.rmtree(folder)
        except:
            pass
    if not os.path.exists(folder):
        os.makedirs(folder)

    # 2. RESOLVE & DOWNLOAD
    # We download 6 candidates to have enough data for comparison
    artist, track = pipeline.resolve_song(user_query)
    if not artist:
        raise HTTPException(status_code=404, detail="Track not found")
    
    candidates = pipeline.get_lastfm_candidates(artist, track, limit=6) 
    candidates.insert(0, f"{track} - {artist}") # Ensure Seed is #1
    
    # Download in parallel
    pipeline.download_audio(candidates)

    # 3. ANALYZE AUDIO
    df = engine.analyze_folder()
    if df is None or df.empty:
        raise HTTPException(status_code=500, detail="Audio analysis failed")

    # 4. CALCULATE SIMILARITY (FIXED)
    # ---------------------------------------------------------
    # Problem: 'Spectral Centroid' (3000) dwarfs 'Tempo' (120).
    # Solution: StandardScaler (Z-score normalization).
    # ---------------------------------------------------------
    
    # Identify which columns are numbers (Features)
    feature_cols = ['Tempo', 'Energy', 'Harmony'] + [c for c in df.columns if 'Timbre' in c]
    
    # Extract just the numbers
    X = df[feature_cols].values

    # SCALER: This forces all features to have Mean=0 and Variance=1.
    # It effectively "Weights" them equally.
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # The Seed is always the first row (index 0)
    seed_vector = X_scaled[0].reshape(1, -1)
    all_vectors = X_scaled

    # Compute Cosine Similarity (-1.0 to 1.0)
    # We multiply by 0.5 + 0.5 to normalize it to 0.0 - 1.0 range, then * 100
    raw_sim = cosine_similarity(seed_vector, all_vectors)[0]
    
    # Convert to percentage (Standard mapping)
    # This prevents negative correlations from looking like "0%"
    sim_percentages = ((raw_sim + 1) / 2) * 100
    
    # Update DataFrame
    df['score'] = sim_percentages.round(1)

    # ---------------------------------------------------------

    # 5. FORMAT RESULTS
    matches = []
    
    # Sort by Score (High to Low)
    # Skip the first one (Seed) in the iteration to handle it separately if needed
    # But here we just map everything.
    
    # Force Seed to be 100% explicitly (math sometimes gives 99.99999)
    df.loc[0, 'score'] = 100.0
    
    sorted_df = df.sort_values(by='score', ascending=False)

    import random
    for i, (_, row) in enumerate(sorted_df.iterrows()):
        is_seed = (i == 0) # After sorting, top is usually seed
        
        # Calculate visual coordinates based on similarity
        # Closer score = Closer to center (50,50)
        dist = (100 - row['score']) * 1.5 # Spread factor
        angle = random.uniform(0, 2 * np.pi)
        
        # Seed is always center
        if is_seed:
            cx, cy = 50, 50
        else:
            cx = 50 + dist * np.cos(angle)
            cy = 50 + dist * np.sin(angle)

        matches.append({
            "id": i,
            "name": row['Name'].replace(".mp3", ""),
            "score": row['score'],
            "filename": row['Name'],
            "isSeed": is_seed,
            "x": cx, 
            "y": cy
        })

    return {"matches": matches}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)