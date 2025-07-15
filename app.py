from flask import Flask, jsonify, send_from_directory
import requests
import re

LUNCHBUS_API = 'https://data.hunter-crm.com/HunterGPS/index.php?id=Lunch_3'

app = Flask(__name__)

@app.route('/api/location')
def proxy_location_api():
    try:
        response = requests.get(LUNCHBUS_API)
        response.raise_for_status()

        html_content = response.text

        pattern = r'var marker = L\.marker\(\[(\d+\.\d+),\s*(\d+\.\d+)\]'

        match = re.search(pattern, html_content)

        if match:
            latitude = float(match.group(1))
            longitude = float(match.group(2))

            return jsonify({
                "latitude": latitude,
                "longitude": longitude
            })
        else:
            return jsonify({"error": "Could not find coordinate pattern in the source HTML."}), 500

    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}, 500)
    
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_png(filename):
    return send_from_directory('.', filename)


if __name__ == '__main__':
    app.run(port=8080, debug=True)