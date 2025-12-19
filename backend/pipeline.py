import os
import yt_dlp
import concurrent.futures
import requests
import config

DOWNLOAD_FOLDER = "songs"

def download_one(query):
    try:
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'{DOWNLOAD_FOLDER}/%(title)s.%(ext)s',
            'postprocessors': [{'key': 'FFmpegExtractAudio','preferredcodec': 'mp3','preferredquality': '128'}],
            'quiet': True,
            'no_warnings': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"ytsearch1:{query}"])
    except:
        pass

def download_audio(candidates):
    # Limit Max Workers to 4 for Heroku RAM safety
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        executor.map(download_one, candidates)

def resolve_song(user_query):
    url = f"http://ws.audioscrobbler.com/2.0/?method=track.search&track={user_query}&api_key={config.LASTFM_KEY}&format=json"
    try:
        data = requests.get(url, timeout=2).json()
        track = data['results']['trackmatches']['track'][0]
        return track['artist'], track['name']
    except:
        return None, None

def get_lastfm_candidates(artist, track, limit=5):
    url = f"http://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist={artist}&track={track}&api_key={config.LASTFM_KEY}&format=json"
    try:
        data = requests.get(url, timeout=2).json()
        candidates = []
        # Respect the limit to prevent timeouts
        for t in data['similartracks']['track'][:limit]:
            candidates.append(f"{t['name']} - {t['artist']['name']}")
        return candidates
    except:
        return []