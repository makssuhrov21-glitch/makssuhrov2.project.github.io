from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import json, os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

DATA_PATH = 'data/products.json'
IMG_DIR = 'images'

os.makedirs('data', exist_ok=True)
os.makedirs(IMG_DIR, exist_ok=True)
if not os.path.exists(DATA_PATH):
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump([], f, ensure_ascii=False, indent=2)

@app.get('/api/products')
def get_products():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        return jsonify(json.load(f))

@app.post('/api/products')
def save_products():
    data = request.get_json(force=True, silent=True)
    if not isinstance(data, list):
        return {'ok': False, 'error': 'Expected JSON array'}, 400
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return {'ok': True}

@app.post('/api/upload')
def upload():
    f = request.files.get('file')
    if not f:
        return {'ok': False, 'error': 'no file'}, 400
    name = f.filename
    path = os.path.join(IMG_DIR, name)
    f.save(path)
    return {'ok': True, 'path': f'images/{name}'}

@app.get('/')
def root():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)

