import click
import json
import logging
import os
import pandas as pd
import requests
from calendar import timegm
from datetime import datetime
from flask import Flask, request, send_from_directory
from flask_cors import CORS
from io import StringIO
from pathlib import Path
from threading import Timer
import time

logging.basicConfig(level=logging.INFO)
db_update_interval = 604800
mal_db_url = 'https://standards-oui.ieee.org/oui/oui.csv'
mam_db_url = 'https://standards-oui.ieee.org/oui28/mam.csv'
mas_db_url = 'https://standards-oui.ieee.org/oui36/oui36.csv'
default_limit = 10
headers = {
    'User-Agent': 'curl/7.68.0',
    'Accept': '*/*'
}

working_dir = Path(__file__).parent.resolve()
data_dir = working_dir / 'data'
init_timer = None
is_initializing = False
mal_db = None
mam_db = None
mas_db = None
app = Flask(__name__)

def download_with_retry(url, retries=3, delay=5):
    for i in range(retries):
        try:
            response = requests.get(url, headers=headers)
            if response.ok:
                return response.text
        except requests.exceptions.RequestException as e:
            logging.error(f"Download failed: {e}")
        time.sleep(delay)
    raise Exception(f"Failed to download file after {retries} attempts")

def init():
    init_cors()
    init_db()

def init_cors():
    cors_domains = os.environ.get('ALLOWED_CORS_DOMAINS')
    if cors_domains:
        allowed_origins = [f"http://{domain}" for domain in cors_domains.split(',')] + \
                          [f"https://{domain}" for domain in cors_domains.split(',')]
        CORS(app, resources={r"/*": {"origins": allowed_origins}})
    else:
        CORS(app)

def init_db():
    global is_initializing, init_timer, mal_db, mam_db, mas_db
    is_initializing = True
    logging.info('Initializing the server')
    if not data_dir.is_dir():
        os.mkdir(data_dir)

    update_db = True
    mal_file = data_dir / 'mal.csv'
    mam_file = data_dir / 'mam.csv'
    mas_file = data_dir / 'mas.csv'
    current_time = datetime.utcnow()
    last_update = data_dir / 'last_update.txt'
    elapsed_time = 0
    if last_update.is_file():
        try:
            timestamp = datetime.utcfromtimestamp(int(last_update.read_text()))
            logging.debug(f'Last OUI DB update time is {timestamp}')
            elapsed_time = (current_time - timestamp).seconds
            if mal_file.exists() and mam_file.exists() and mas_file.exists() and elapsed_time < db_update_interval:
                update_db = False
        except:
            os.remove(last_update)

    if update_db:
        logging.debug('Updating and loading OUI DB')
        last_update.write_text(str(timegm(current_time.utctimetuple())))
        try:
            logging.debug('Downloading MA-L DB')
            mal_csv_content = download_with_retry(mal_db_url)
            mal_db = pd.read_csv(StringIO(mal_csv_content))
            if 'Assignment' not in mal_db.columns:
                raise KeyError("'Assignment' column is missing in MA-L DB")
            mal_db = mal_db.sort_values('Assignment').reset_index(drop=True)
            mal_db.to_csv(mal_file, index=False)
            logging.debug(f'Successfully saved MA-L DB to {mal_file.absolute()}')

            logging.debug('Downloading MA-M DB')
            mam_csv_content = download_with_retry(mam_db_url)
            mam_db = pd.read_csv(StringIO(mam_csv_content))
            if 'Assignment' not in mam_db.columns:
                raise KeyError("'Assignment' column is missing in MA-M DB")
            mam_db = mam_db.sort_values('Assignment').reset_index(drop=True)
            mam_db.to_csv(mam_file, index=False)
            logging.debug(f'Successfully saved MA-M DB to {mam_file.absolute()}')

            logging.debug('Downloading MA-S DB')
            mas_csv_content = download_with_retry(mas_db_url)
            mas_db = pd.read_csv(StringIO(mas_csv_content))
            if 'Assignment' not in mas_db.columns:
                raise KeyError("'Assignment' column is missing in MA-S DB")
            mas_db = mas_db.sort_values('Assignment').reset_index(drop=True)
            mas_db.to_csv(mas_file, index=False)
            logging.debug(f'Successfully saved MA-S DB to {mas_file.absolute()}')

        except Exception as e:
            logging.error(f"Failed to update and load OUI DB: {e}")
            raise
    else:
        logging.debug('Loading OUI DB')
        mal_db = pd.read_csv(mal_file)
        mam_db = pd.read_csv(mam_file)
        mas_db = pd.read_csv(mas_file)

    logging.info('Server initialized successfully')
    init_timer = Timer(db_update_interval - elapsed_time, init)
    init_timer.start()
    is_initializing = False

def is_hex(input: str):
    if len(input) < 1:
        return False
    for c in input:
        if not (c.isdigit() or ('A' <= c <= 'F') or ('a' <= c <= 'f')):
            return False
    return True

def get_mac(input: str):
    if len(input) < 1:
        return None
    mac = input.replace(':', '').replace('-', '').upper()
    if len(mac) > 12:
        return None
    if not is_hex(mac):
        return None
    return mac

def search_mac(query, page=None, limit=None):
    res_data = {}
    if 6 <= len(query) <= 17:
        mac = get_mac(query)
        if mac is None:
            raise
        mac_len = len(mac)

        search_result = mal_db[mal_db['Assignment'].str.startswith(mac[:6])]

        result_count = len(search_result.index)
        if result_count < 1 or search_result['Organization Name'].iloc[0] == 'IEEE Registration Authority':
            search_result = []
            search_result.append(mam_db[mam_db['Assignment'].str.startswith(mac[:mac_len if mac_len < 7 else 7])])
            search_result.append(mas_db[mas_db['Assignment'].str.startswith(mac[:mac_len if mac_len < 9 else 9])])
            search_result = pd.concat(search_result, axis=0, ignore_index=True)
            result_count = len(search_result.index)

        if result_count < 1:
            res_data['count'] = 0
            if mac[1] in ('2', '6', 'A', 'E'):
                res_data['info'] = 'This MAC address is randomly generated.'
            else:
                res_data['info'] = "No OUI information found for the given MAC address."
        else:
            res_data['total'] = result_count
            if page is not None and limit is not None:
                data = search_result.iloc[(page - 1) * limit: page * limit].to_dict('records')
            else:
                data = search_result.to_dict('records')
            result_count = len(data)
            if result_count > 0:
                res_data['count'] = result_count
                res_data['data'] = data
            else:
                res_data['info'] = "No more OUI information found for the given MAC address."
    else:
        raise
    return res_data

def search_organization_name(query, page=None, limit=None):
    res_data = {}
    search_result = []
    search_result.append(mal_db[mal_db['Organization Name'].str.contains(query, False)])
    search_result.append(mam_db[mam_db['Organization Name'].str.contains(query, False)])
    search_result.append(mas_db[mas_db['Organization Name'].str.contains(query, False)])
    search_result = pd.concat(search_result, axis=0, ignore_index=True)
    result_count = len(search_result.index)

    if result_count < 1:
        res_data['count'] = 0
        res_data['info'] = "No OUI information found for the given organization name."
    else:
        res_data['total'] = result_count
        if page is not None and limit is not None:
            data = search_result.iloc[(page - 1) * limit: page * limit].to_dict('records')
        else:
            data = search_result.to_dict('records')
        result_count = len(data)
        if result_count > 0:
            res_data['count'] = result_count
            res_data['data'] = data
        else:
            res_data['info'] = "No more OUI information found for the given organization name."

    return res_data

def search_oui_info(query, page=None, limit=None):
    try:
        return search_mac(query, page, limit)
    except:
        return search_organization_name(query, page, limit)

@app.route('/<argument>')
def get_oui_info(argument):
    global is_initializing

    if is_initializing:
        return '', 503

    page = request.args.get('page', default=None, type=int)
    limit = request.args.get('limit', default=None, type=int)

    if page is None and limit is not None:
        page = 1
    elif page is not None:
        if limit is None:
            limit = default_limit
        if page < 1:
            page = 1

    res_data = search_oui_info(argument, page, limit)
    res_code = 200
    res_header = {'Content-Type': 'application/json; charset=utf-8'}

    res_data = json.dumps(res_data)

    return res_data, res_code, res_header

@app.route('/')
def root():
    return '', 400, {}

@click.command()
@click.option('--verbose', '-v', is_flag=True, default=False, help='Get detailed log including debug messages')
@click.option('--host', '-l', default='0.0.0.0', help='Host of the web server')
@click.option('--port', '-p', default=5000, help='Port of the HTTP server')
@click.option('--debug', '-d', is_flag=True, default=False, help='Set debug mode')
@click.option('--cors', '-c', multiple=True, help='Allowed CORS domains (can specify multiple)')
def main(verbose, host, port, debug, cors):
    global init_timer

    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    app.config['DEBUG'] = debug

    if cors:
        cors_env = ','.join(cors)
        os.environ['ALLOWED_CORS_DOMAINS'] = cors_env

    init()
    app.run(host=host, port=port, debug=debug)
    init_timer.cancel()

if __name__ == "__main__":
    main()
