import os
import requests
import librosa
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import urllib.parse
import concurrent.futures
import warnings
import uuid

warnings.filterwarnings('ignore')

# --- 1. SEARCH & METADATA ---
def search_itunes(query, limit=1):
    try:
        term = urllib.parse.quote(query)
        url = f"https://itunes.apple.com/search?term={term}&media=music&entity=song&limit={limit}"
        res = requests.get(url, timeout=5).json()
        results = []
        for track in res.get('results', []):
            results.append({
                "name": track.get('trackName'),
                "artist": track.get('artistName'),
                "image": track.get('artworkUrl100', '').replace('100x100', '600x600'),
                "preview_url": track.get('previewUrl'),
                "id": str(track.get('trackId'))
            })
        return results
    except Exception as e:
        print(f"❌ iTunes Search Error: {e}")
        return []

# --- 2. AUDIO ANALYSIS ---
def extract_features(preview_url):
    if not preview_url: return None
    unique_id = uuid.uuid4().hex
    filename = f"temp_{unique_id}.m4a"
    try:
        response = requests.get(preview_url, timeout=10)
        with open(filename, 'wb') as f:
            f.write(response.content)
        y, sr = librosa.load(filename, duration=10)
        
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        tempo = float(tempo[0]) if np.ndim(tempo) > 0 else float(tempo)
        spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
        spectral_bandwidth = float(np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr)))
        rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr)))
        zero_crossing_rate = float(np.mean(librosa.feature.zero_crossing_rate(y)))
        mfcc = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20), axis=1)
        
        vector = [tempo, spectral_centroid, spectral_bandwidth, rolloff, zero_crossing_rate]
        vector.extend(mfcc.tolist())
        return np.nan_to_num(np.array(vector))
    except Exception:
        return None
    finally:
        if os.path.exists(filename):
            os.remove(filename)

# --- 3. ORCHESTRATOR ---
def get_track_data(query):
    print(f"🔎 Searching for: {query}")
    candidates = search_itunes(query, limit=1)
    if not candidates: return None
    seed_track = candidates[0]
    seed_vector = extract_features(seed_track['preview_url'])
    if seed_vector is None: return None
        
    recs = search_itunes(seed_track['artist'], limit=10)
    recs = [r for r in recs if r['name'] != seed_track['name']]
    all_tracks = [{**seed_track, "vector": seed_vector, "isSeed": True}]
    
    print("🧠 Analyzing comparisons...")
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_to_track = {executor.submit(extract_features, t['preview_url']): t for t in recs}
        for future in concurrent.futures.as_completed(future_to_track):
            track = future_to_track[future]
            try:
                vector = future.result()
                if vector is not None:
                    all_tracks.append({**track, "vector": vector, "isSeed": False})
            except: pass

    return calculate_similarity(all_tracks)

def calculate_similarity(tracks):
    if not tracks: return None
    vectors = [t['vector'] for t in tracks]
    X = np.nan_to_num(np.array(vectors))
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    seed_vec = X_scaled[0].reshape(1, -1)
    sim_scores = cosine_similarity(seed_vec, X_scaled)[0]
    
    results = []
    for i, track in enumerate(tracks):
        score = ((sim_scores[i] + 1) / 2) * 100
        
        # --- THE FIX IS HERE ---
        # Old Value: 0.2 (Too small, 20px radius)
        # New Value: 4.0 (Big, 400px radius)
        dist = (100 - score) * 4.0 
        
        angle = np.random.uniform(0, 2 * np.pi)
        
        results.append({
            "id": i,
            "name": track['name'],
            "artist": track['artist'],
            "image": track['image'],
            "preview_url": track['preview_url'],
            "score": round(score, 1),
            "isSeed": track['isSeed'],
            "x": dist * np.cos(angle),
            "y": dist * np.sin(angle)
        })
        
    results.sort(key=lambda x: x['score'], reverse=True)
    return {"matches": results}
