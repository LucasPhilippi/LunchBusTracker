from flask import Flask, jsonify, send_from_directory
from http import HTTPStatus
import requests
import re

# Constants
LUNCHBUS_API = 'https://data.hunter-crm.com/HunterGPS/index.php?id='
NO_BUS_FOUND_RESPONSE_CONTENT = 'Geen gegevens beschikbaar.'
BUS_LOCATION_COORDINATES_PATTERN = r'var marker = L\.marker\(\[(\d+\.\d+),\s*(\d+\.\d+)\]'

app = Flask(__name__)

@app.route('/api/location/<int:bus_id>')
def proxy_location_api(bus_id):
    try:
        lunch_bus_id = f"Lunch_{bus_id}"
        response = requests.get(LUNCHBUS_API + lunch_bus_id)
        response.raise_for_status()
        html_content = response.text

        if html_content.__contains__(NO_BUS_FOUND_RESPONSE_CONTENT):
            return jsonify({"error": f"No lunch bus resource found with id: {lunch_bus_id}"}), HTTPStatus.NOT_FOUND

        match = re.search(BUS_LOCATION_COORDINATES_PATTERN, html_content)
        if match:
            latitude = float(match.group(1))
            longitude = float(match.group(2))

            return jsonify({
                "busNumber": bus_id,
                "latitude": latitude,
                "longitude": longitude
            }), HTTPStatus.OK
        else:
            return jsonify({"error": "Could not find coordinate pattern in the source HTML."}), HTTPStatus.INTERNAL_SERVER_ERROR

    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR)
    
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_png(filename):
    return send_from_directory('.', filename)


if __name__ == '__main__':
    app.run(port=8080, debug=True)