import os
import librosa
import numpy as np
import pandas as pd
import concurrent.futures # <--- The Secret Weapon

FOLDER_PATH = "songs"

def extract_features(file_path):
    """
    Worker function: Extracts DNA from ONE song.
    """
    try:
        # Load audio (Fastest safe sample rate is 22050)
        y, sr = librosa.load(file_path, sr=22050, duration=30) 
        
        # 1. Rhythm (Tempo)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        
        # 2. Timbre (MFCCs)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)
        
        # 3. Energy (Spectral Centroid)
        cent = librosa.feature.spectral_centroid(y=y, sr=sr)
        cent_mean = np.mean(cent)
        
        # 4. Harmony (Chroma)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_mean = np.mean(chroma)
        
        # Pack data
        features = [file_path.split(os.sep)[-1], float(tempo), float(cent_mean), float(chroma_mean)]
        for i in range(5): # Take top 5 MFCCs
            features.append(float(mfcc_mean[i]))
            
        return features
        
    except Exception as e:
        print(f"❌ Corrupt file {file_path}: {e}")
        return None

def analyze_folder():
    """
    Manager function: Runs analysis in PARALLEL.
    """
    if not os.path.exists(FOLDER_PATH):
        return None

    files = [os.path.join(FOLDER_PATH, f) for f in os.listdir(FOLDER_PATH) if f.endswith('.mp3')]
    
    if not files:
        return None

    print(f"🧠 Neural Engine: Analyzing {len(files)} audio streams in parallel...")

    features_list = []
    
    # ProcessPoolExecutor uses separate CPU cores for true parallelism
    with concurrent.futures.ProcessPoolExecutor() as executor:
        results = executor.map(extract_features, files)
        
        for res in results:
            if res is not None:
                features_list.append(res)

    # Columns
    cols = ['Name', 'Tempo', 'Energy', 'Harmony'] + [f'Timbre_{i}' for i in range(5)]
    df = pd.DataFrame(features_list, columns=cols)
    
    return df