import os
import logging
import time
import requests
import pandas as pd
import click
from io import StringIO
from pathlib import Path
from threading import Lock, Thread
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OUIDataManager:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.data_dir.mkdir(exist_ok=True)
        self.cache_path = self.data_dir / "oui_cache.pkl"
        self.df = None
        self.lock = Lock()
        self.urls = [
            'https://standards-oui.ieee.org/oui/oui.csv',
            'https://standards-oui.ieee.org/oui28/mam.csv',
            'https://standards-oui.ieee.org/oui36/oui36.csv'
        ]
        self.load_from_cache()

    def is_ready(self):
        return self.df is not None

    def load_from_cache(self):
        if self.cache_path.exists():
            try:
                mtime = datetime.fromtimestamp(self.cache_path.stat().st_mtime)
                if (datetime.now() - mtime).days < 7:
                    with self.lock:
                        self.df = pd.read_pickle(self.cache_path)
                    return True
            except Exception:
                pass
        return False

    def update_loop(self):
        while True:
            if self.is_ready() and self.cache_path.exists():
                 mtime = datetime.fromtimestamp(self.cache_path.stat().st_mtime)
                 if (datetime.now() - mtime).days < 7:
                     time.sleep(3600)
                     continue

            try:
                temp_dfs = []
                for url in self.urls:
                    try:
                        res = requests.get(url, headers={'User-Agent': 'curl/7.68.0'}, timeout=30)
                        if res.ok:
                            df = pd.read_csv(StringIO(res.text))
                            cols = [c for c in df.columns if c in ['Assignment', 'Organization Name', 'Organization Address']]
                            if len(cols) >= 2:
                                temp_dfs.append(df[cols])
                    except Exception:
                        pass

                if temp_dfs:
                    combined = pd.concat(temp_dfs, ignore_index=True)
                    combined['clean_mac'] = combined['Assignment'].astype(str).str.replace(r'[:\-]', '', regex=True).str.upper()
                    
                    with self.lock:
                        self.df = combined
                        self.df.to_pickle(self.cache_path)
                
            except Exception:
                pass
            
            time.sleep(604800) 

    def search(self, query: str, page: int, limit: int):
        if self.df is None:
            return None

        query = query.strip()
        clean_query = query.replace(':', '').replace('-', '').upper()
        
        is_hex = all(c in '0123456789ABCDEF' for c in clean_query)
        is_mac_search = is_hex and len(clean_query) >= 2

        if is_mac_search:
            mask = self.df['clean_mac'].str.startswith(clean_query, na=False)
            results = self.df[mask]
        else:
            results = self.df[self.df['Organization Name'].str.contains(query, case=False, na=False)]

        total = len(results)
        start = (page - 1) * limit
        end = start + limit
        
        safe_df = results.iloc[start:end].fillna('')
        
        return {
            "meta": {
                "total": total,
                "page": page,
                "limit": limit,
                "type": "MAC" if is_mac_search else "ORG"
            },
            "data": safe_df.to_dict('records')
        }

app = Flask(__name__)
manager = OUIDataManager(Path(__file__).parent / 'data')

@app.route('/oui', methods=['GET'])
def get_oui():
    if not manager.is_ready():
        return jsonify({"error": "Initializing database"}), 503

    query = request.args.get('q')
    if not query:
        return jsonify({"error": "Missing 'q' parameter"}), 400
    
    try:
        page = max(1, request.args.get('page', 1, type=int))
        limit = max(1, request.args.get('limit', 10, type=int))
        
        result = manager.search(query, page, limit)
        
        if not result or result['meta']['total'] == 0:
            return jsonify({
                "meta": {"total": 0, "page": page, "limit": limit}, 
                "data": []
            }), 404
            
        return jsonify(result), 200

    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500

@click.command()
@click.option('--port', default=5000)
@click.option('--host', default='0.0.0.0')
@click.option('--cors-domains', default='*')
def main(port, host, cors_domains):
    if cors_domains == '*':
        CORS(app)
    else:
        origins = cors_domains.split(',')
        CORS(app, origins=origins)

    updater = Thread(target=manager.update_loop, daemon=True)
    updater.start()
    
    app.run(host=host, port=port)

if __name__ == "__main__":
    main()
