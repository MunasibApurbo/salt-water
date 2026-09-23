import os
import subprocess
import json
import re

BASE_DIR = "/Users/munasibapurbo/Documents/Sundarbans Website"
WEB_DIR = os.path.join(BASE_DIR, "assets/images/web")
THUMB_DIR = os.path.join(BASE_DIR, "assets/images/thumbs")
DATA_DIR = os.path.join(BASE_DIR, "assets/data")

os.makedirs(WEB_DIR, exist_ok=True)
os.makedirs(THUMB_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

PHOTO_CATALOG = {
    "IMG_4036.jpeg": {
        "id": "highway-twilight",
        "title": "Highway at Twilight",
        "chapter_num": 1,
        "chapter": "Chapter 1: The Highway & Crossing",
        "category": "padma-road",
        "category_label": "Padma & Road",
        "waypoint_id": "wp-1",
        "destination": "Highway Route N7",
        "coordinates": "23.6052° N, 89.8407° E",
        "description": "Highway luminary silhouetted against the open twilight sky heading south toward the delta.",
        "year": "2026"
    },
    "IMG_4037.jpeg": {
        "id": "hardinge-lalon-shah-bridges",
        "title": "Hardinge & Lalon Shah Bridges",
        "chapter_num": 1,
        "chapter": "Chapter 1: The Highway & Crossing",
        "category": "padma-road",
        "category_label": "Padma & Road",
        "waypoint_id": "wp-2",
        "destination": "Paksey, Padma River",
        "coordinates": "24.0864° N, 89.0305° E",
        "description": "The century-old steel trestles of the Hardinge Bridge standing beside the modern Lalon Shah Bridge over the Padma.",
        "year": "2026"
    },
    "IMG_4094.jpeg": {
        "id": "wooden-boat-rooppur",
        "title": "Wooden Boat & Rooppur Horizon",
        "chapter_num": 1,
        "chapter": "Chapter 1: The Highway & Crossing",
        "category": "padma-road",
        "category_label": "Padma & Road",
        "waypoint_id": "wp-2",
        "destination": "Padma Riverbank",
        "coordinates": "24.0682° N, 89.0461° E",
        "description": "A wooden fishing dinghy moored on the silty banks of the Padma, with the Rooppur cooling towers in the distance.",
        "year": "2026"
    },
    "IMG_4709.jpeg": {
        "id": "adomya-bangla-khulna-university",
        "title": "Adomya Bangla Sculpture",
        "chapter_num": 1,
        "chapter": "Chapter 1: The Highway & Crossing",
        "category": "padma-road",
        "category_label": "Padma & Road",
        "waypoint_id": "wp-3",
        "destination": "Khulna University, Gallamari",
        "coordinates": "22.8025° N, 89.5338° E",
        "description": "The 'Adomya Bangla' (Indomitable Bengal) 1971 Liberation War sculpture by Gopal Chandra Pal on the Khulna University campus.",
        "year": "2026"
    },
    "IMG_4613.jpeg": {
        "id": "navy-frigates-mongla",
        "title": "Navy Frigates at Mongla Port",
        "chapter_num": 2,
        "chapter": "Chapter 2: Khulna & Delta Bridges",
        "category": "port-bridges",
        "category_label": "Khulna & Bridges",
        "waypoint_id": "wp-5",
        "destination": "Mongla Port",
        "coordinates": "22.4858° N, 89.5936° E",
        "description": "Bangladesh Navy warship frigates berthed along the tidal quayside at Mongla Port.",
        "year": "2026"
    },
    "IMG_4639.jpeg": {
        "id": "pashur-silos-barges",
        "title": "Pashur River Silos & Barges",
        "chapter_num": 2,
        "chapter": "Chapter 2: Khulna & Delta Bridges",
        "category": "port-bridges",
        "category_label": "Khulna & Bridges",
        "waypoint_id": "wp-5",
        "destination": "Pashur River",
        "coordinates": "22.5210° N, 89.6015° E",
        "description": "Industrial grain silos, conveyors, and moored cargo barges along the banks of the Pashur River.",
        "year": "2026"
    },
    "IMG_4661.jpeg": {
        "id": "transmission-towers-wetlands",
        "title": "Transmission Towers over Wetlands",
        "chapter_num": 2,
        "chapter": "Chapter 2: Khulna & Delta Bridges",
        "category": "port-bridges",
        "category_label": "Khulna & Bridges",
        "waypoint_id": "wp-4",
        "destination": "Bagerhat Wetlands",
        "coordinates": "22.6120° N, 89.6432° E",
        "description": "High-voltage electricity transmission towers striding across flooded southern marshlands.",
        "year": "2026"
    },
    "IMG_4675.jpeg": {
        "id": "rupsha-bridge-truss",
        "title": "Rupsha Rail Bridge Truss",
        "chapter_num": 2,
        "chapter": "Chapter 2: Khulna & Delta Bridges",
        "category": "port-bridges",
        "category_label": "Khulna & Bridges",
        "waypoint_id": "wp-4",
        "destination": "Rupsha River, Khulna",
        "coordinates": "22.7831° N, 89.5872° E",
        "description": "Triangular steel truss structure and riveted girder undercarriage of the new Rupsha Railway Bridge.",
        "year": "2026"
    },
    "IMG_4680.jpeg": {
        "id": "rupsha-bridge-span",
        "title": "Rupsha Rail Bridge Over River",
        "chapter_num": 2,
        "chapter": "Chapter 2: Khulna & Delta Bridges",
        "category": "port-bridges",
        "category_label": "Khulna & Bridges",
        "waypoint_id": "wp-4",
        "destination": "Rupsha River, Khulna",
        "coordinates": "22.7845° N, 89.5880° E",
        "description": "Wide perspective across the heavy blue steel spans of the railway bridge connecting the southern delta.",
        "year": "2026"
    },
    "IMG_4682.jpeg": {
        "id": "under-rupsha-viaduct",
        "title": "Under the Rupsha Viaduct",
        "chapter_num": 2,
        "chapter": "Chapter 2: Khulna & Delta Bridges",
        "category": "port-bridges",
        "category_label": "Khulna & Bridges",
        "waypoint_id": "wp-4",
        "destination": "Khulna",
        "coordinates": "22.7820° N, 89.5865° E",
        "description": "Vertical perspective beneath the elevated railway piers and viaduct crossbeams.",
        "year": "2026"
    },
    "IMG_4691.jpeg": {
        "id": "submerged-brick-ghat",
        "title": "Submerged Brick Ghat",
        "chapter_num": 2,
        "chapter": "Chapter 2: Khulna & Delta Bridges",
        "category": "port-bridges",
        "category_label": "Khulna & Bridges",
        "waypoint_id": "wp-4",
        "destination": "Rupsha River",
        "coordinates": "22.7650° N, 89.5912° E",
        "description": "Weathered red brick steps of an old river ghat partially submerged by high brackish tide.",
        "year": "2026"
    },
    "IMG_4694.jpeg": {
        "id": "monsoon-cloudscape",
        "title": "Monsoon Cloudscape",
        "chapter_num": 2,
        "chapter": "Chapter 2: Khulna & Delta Bridges",
        "category": "port-bridges",
        "category_label": "Khulna & Bridges",
        "waypoint_id": "wp-4",
        "destination": "Khulna Outskirts",
        "coordinates": "22.7912° N, 89.5740° E",
        "description": "A massive cumulus cloud anvil building over rural palms and wetlands outside Khulna.",
        "year": "2026"
    },
    "IMG_4169.jpeg": {
        "id": "cabin-window-view",
        "title": "Cabin Window View",
        "chapter_num": 3,
        "chapter": "Chapter 3: Life Aboard the Cruiser",
        "category": "cruiser-life",
        "category_label": "Aboard Cruiser",
        "waypoint_id": "wp-6",
        "destination": "Pashur River",
        "coordinates": "22.3512° N, 89.6105° E",
        "description": "Dining cabin curtains framing the quiet rhythm of passing riverbanks and distant palms.",
        "year": "2026"
    },
    "IMG_4188.jpeg": {
        "id": "cruiser-the-sail-convoy",
        "title": "Cruiser 'The Sail' in Convoy",
        "chapter_num": 3,
        "chapter": "Chapter 3: Life Aboard the Cruiser",
        "category": "cruiser-life",
        "category_label": "Aboard Cruiser",
        "waypoint_id": "wp-6",
        "destination": "Pashur Channel",
        "coordinates": "22.3120° N, 89.6234° E",
        "description": "Sister expedition vessel 'The Sail' cruising down the wide channel of the Pashur River.",
        "year": "2026"
    },
    "IMG_4190.jpeg": {
        "id": "searchlights-observation-deck",
        "title": "Searchlights on the Observation Deck",
        "chapter_num": 3,
        "chapter": "Chapter 3: Life Aboard the Cruiser",
        "category": "cruiser-life",
        "category_label": "Aboard Cruiser",
        "waypoint_id": "wp-6",
        "destination": "Cruiser Upper Deck",
        "coordinates": "22.2891° N, 89.6350° E",
        "description": "High-intensity searchlights mounted on the bridge roof for nighttime delta navigation.",
        "year": "2026"
    },
    "IMG_4642.jpeg": {
        "id": "captain-at-the-helm",
        "title": "Captain at the Wooden Helm",
        "chapter_num": 3,
        "chapter": "Chapter 3: Life Aboard the Cruiser",
        "category": "cruiser-life",
        "category_label": "Aboard Cruiser",
        "waypoint_id": "wp-6",
        "destination": "Wheelhouse",
        "coordinates": "22.2405° N, 89.6540° E",
        "description": "The vessel captain in the wheelhouse steering with hands on the classic wooden ship wheel.",
        "year": "2026"
    },
    "IMG_4594.jpeg": {
        "id": "promenade-deck-night",
        "title": "Promenade Deck at Night",
        "chapter_num": 3,
        "chapter": "Chapter 3: Life Aboard the Cruiser",
        "category": "cruiser-life",
        "category_label": "Aboard Cruiser",
        "waypoint_id": "wp-6",
        "destination": "Cruiser Anchorage",
        "coordinates": "22.0210° N, 89.6820° E",
        "description": "Warm lamplight illuminating the wooden deck planks at night as the ship rests at anchor.",
        "year": "2026"
    },
    "IMG_4212.jpeg": {
        "id": "karamjal-mangrove-boundary",
        "title": "Karamjal Mangrove Boundary",
        "chapter_num": 4,
        "chapter": "Chapter 4: Karamjal & Mangrove Reserve",
        "category": "mangrove-wild",
        "category_label": "Karamjal & Mangrove",
        "waypoint_id": "wp-7",
        "destination": "Karamjal Eco Park",
        "coordinates": "22.4278° N, 89.5992° E",
        "description": "Crossing into the Karamjal reserve, where lush tidal mudflats meet the dense mangrove forest edge.",
        "year": "2026"
    },
    "IMG_4222.jpeg": {
        "id": "pneumatophore-roots",
        "title": "Pneumatophore Breathing Roots",
        "chapter_num": 4,
        "chapter": "Chapter 4: Karamjal & Mangrove Reserve",
        "category": "mangrove-wild",
        "category_label": "Karamjal & Mangrove",
        "waypoint_id": "wp-7",
        "destination": "Karamjal Understory",
        "coordinates": "22.4285° N, 89.5980° E",
        "description": "Countless pointed pneumatophore spike roots rising from the silty marsh mud to breathe during low tide.",
        "year": "2026"
    },
    "IMG_4229.jpeg": {
        "id": "lianas-over-creek",
        "title": "Lianas Reflected in Creek",
        "chapter_num": 4,
        "chapter": "Chapter 4: Karamjal & Mangrove Reserve",
        "category": "mangrove-wild",
        "category_label": "Karamjal & Mangrove",
        "waypoint_id": "wp-8",
        "destination": "Mangrove Canal",
        "coordinates": "22.4150° N, 89.6050° E",
        "description": "Twisted woody jungle lianas hanging over the glassy surface of a quiet tidal creek.",
        "year": "2026"
    },
    "IMG_4235.jpeg": {
        "id": "observation-watchtower",
        "title": "Observation Watchtower",
        "chapter_num": 4,
        "chapter": "Chapter 4: Karamjal & Mangrove Reserve",
        "category": "mangrove-wild",
        "category_label": "Karamjal & Mangrove",
        "waypoint_id": "wp-7",
        "destination": "Karamjal Reserve",
        "coordinates": "22.4290° N, 89.5985° E",
        "description": "Wooden wildlife and dolphin observation tower rising high above the green forest canopy.",
        "year": "2026"
    },
    "IMG_4239.jpeg": {
        "id": "canopy-panorama-tower",
        "title": "Canopy Panorama from Tower",
        "chapter_num": 4,
        "chapter": "Chapter 4: Karamjal & Mangrove Reserve",
        "category": "mangrove-wild",
        "category_label": "Karamjal & Mangrove",
        "waypoint_id": "wp-7",
        "destination": "Karamjal Summit",
        "coordinates": "22.4291° N, 89.5987° E",
        "description": "High panoramic vantage point looking out over miles of unbroken green canopy and curving tidal rivers.",
        "year": "2026"
    },
    "IMG_4251.jpeg": {
        "id": "golpata-palms-dinghy",
        "title": "Golpata Palms & Moored Dinghy",
        "chapter_num": 4,
        "chapter": "Chapter 4: Karamjal & Mangrove Reserve",
        "category": "mangrove-wild",
        "category_label": "Karamjal & Mangrove",
        "waypoint_id": "wp-8",
        "destination": "Harbaria Creek",
        "coordinates": "22.3115° N, 89.6450° E",
        "description": "Arching fronds of wild Golpata (nypa palms) overhanging a wooden dinghy in the canal.",
        "year": "2026"
    },
    "IMG_4598.jpeg": {
        "id": "saltwater-crocodile",
        "title": "Saltwater Crocodile in Duckweed",
        "chapter_num": 4,
        "chapter": "Chapter 4: Karamjal & Mangrove Reserve",
        "category": "mangrove-wild",
        "category_label": "Karamjal & Mangrove",
        "waypoint_id": "wp-7",
        "destination": "Karamjal Sanctuary",
        "coordinates": "22.4282° N, 89.5995° E",
        "description": "A saltwater crocodile basking motionless on a mudbank, covered in a vivid blanket of green duckweed.",
        "year": "2026"
    },
    "IMG_4424.jpeg": {
        "id": "wild-water-lily-shapla",
        "title": "Wild Water Lily (Shapla)",
        "chapter_num": 4,
        "chapter": "Chapter 4: Karamjal & Mangrove Reserve",
        "category": "mangrove-wild",
        "category_label": "Karamjal & Mangrove",
        "waypoint_id": "wp-8",
        "destination": "Harbaria Pond",
        "coordinates": "22.3140° N, 89.6465° E",
        "description": "A solitary wild white water lily floating serenely in a freshwater forest pond.",
        "year": "2026"
    },
    "IMG_4426.jpeg": {
        "id": "sundari-tree-canopy",
        "title": "Sundari Tree Canopy",
        "chapter_num": 4,
        "chapter": "Chapter 4: Karamjal & Mangrove Reserve",
        "category": "mangrove-wild",
        "category_label": "Karamjal & Mangrove",
        "waypoint_id": "wp-8",
        "destination": "Deep Forest",
        "coordinates": "22.3080° N, 89.6490° E",
        "description": "Looking directly up into the dense canopy of mature Sundari trees filtering the afternoon sun.",
        "year": "2026"
    },
    "IMG_4319.jpeg": {
        "id": "boatman-at-the-bow",
        "title": "River Boatman",
        "chapter_num": 4,
        "chapter": "Chapter 4: Karamjal & Mangrove Reserve",
        "category": "mangrove-wild",
        "category_label": "Karamjal & Mangrove",
        "waypoint_id": "wp-8",
        "destination": "Tidal Canal",
        "coordinates": "22.3100° N, 89.6470° E",
        "description": "Our local dinghy boatman smiling warmly at the bow while navigating the narrow canal.",
        "year": "2026"
    },
    "IMG_4433.jpeg": {
        "id": "moored-fishing-trawlers",
        "title": "Moored Fishing Trawlers",
        "chapter_num": 4,
        "chapter": "Chapter 4: Karamjal & Mangrove Reserve",
        "category": "mangrove-wild",
        "category_label": "Karamjal & Mangrove",
        "waypoint_id": "wp-8",
        "destination": "Fishermen's Bank",
        "coordinates": "22.2540° N, 89.6670° E",
        "description": "A fleet of traditional wooden sea fishing trawlers tied side-by-side along the muddy bank.",
        "year": "2026"
    },
    "IMG_4440.jpeg": {
        "id": "kashful-meadow",
        "title": "Kashful Meadow",
        "chapter_num": 5,
        "chapter": "Chapter 5: Kotka Beach & Bay of Bengal",
        "category": "coast-kotka",
        "category_label": "Kotka & Coast",
        "waypoint_id": "wp-9",
        "destination": "Kotka Trail",
        "coordinates": "21.8652° N, 89.7785° E",
        "description": "White plumes of wild Kashful reeds blooming along the coastal grasslands at Kotka.",
        "year": "2026"
    },
    "IMG_4442.jpeg": {
        "id": "kashful-reeds-closeup",
        "title": "Kashful Reeds Close-Up",
        "chapter_num": 5,
        "chapter": "Chapter 5: Kotka Beach & Bay of Bengal",
        "category": "coast-kotka",
        "category_label": "Kotka & Coast",
        "waypoint_id": "wp-9",
        "destination": "Kotka Meadow",
        "coordinates": "21.8640° N, 89.7790° E",
        "description": "Close-up of delicate autumn Kashful silks catching the warm afternoon light.",
        "year": "2026"
    },
    "IMG_4463.jpeg": {
        "id": "sand-bubbler-crab-patterns",
        "title": "Sand Bubbler Crab Patterns",
        "chapter_num": 5,
        "chapter": "Chapter 5: Kotka Beach & Bay of Bengal",
        "category": "coast-kotka",
        "category_label": "Kotka & Coast",
        "waypoint_id": "wp-9",
        "destination": "Jamtola Beach",
        "coordinates": "21.8510° N, 89.7820° E",
        "description": "Geometric radial patterns of sand pellets rolled by tiny sand bubbler crabs on the beach.",
        "year": "2026"
    },
    "IMG_4465.jpeg": {
        "id": "jamtola-sea-beach",
        "title": "Jamtola Sea Beach at Low Tide",
        "chapter_num": 5,
        "chapter": "Chapter 5: Kotka Beach & Bay of Bengal",
        "category": "coast-kotka",
        "category_label": "Kotka & Coast",
        "waypoint_id": "wp-9",
        "destination": "Bay of Bengal Coast",
        "coordinates": "21.8480° N, 89.7845° E",
        "description": "Vast golden sandbar at Jamtola Beach stretching infinitely toward the open sea.",
        "year": "2026"
    },
    "IMG_4466.jpeg": {
        "id": "mangrove-coastal-edge",
        "title": "Mangrove Edge along Shore",
        "chapter_num": 5,
        "chapter": "Chapter 5: Kotka Beach & Bay of Bengal",
        "category": "coast-kotka",
        "category_label": "Kotka & Coast",
        "waypoint_id": "wp-9",
        "destination": "Kotka Shoreline",
        "coordinates": "21.8505° N, 89.7830° E",
        "description": "Dense wall of salt-tolerant mangrove trees meeting the surf at high-tide line.",
        "year": "2026"
    },
    "IMG_4239(1).jpeg": {
        "id": "eroded-mangrove-stumps",
        "title": "Eroded Mangrove Stumps",
        "chapter_num": 5,
        "chapter": "Chapter 5: Kotka Beach & Bay of Bengal",
        "category": "coast-kotka",
        "category_label": "Kotka & Coast",
        "waypoint_id": "wp-9",
        "destination": "Kotka Dead Forest Beach",
        "coordinates": "21.8492° N, 89.7815° E",
        "description": "Bleached, eroded mangrove tree stumps standing like sculptures against the ocean waves.",
        "year": "2026"
    },
    "IMG_4502.jpeg": {
        "id": "fishing-boat-sunset",
        "title": "Fishing Boat at Sunset",
        "chapter_num": 5,
        "chapter": "Chapter 5: Kotka Beach & Bay of Bengal",
        "category": "coast-kotka",
        "category_label": "Kotka & Coast",
        "waypoint_id": "wp-9",
        "destination": "Bay of Bengal",
        "coordinates": "21.8450° N, 89.7860° E",
        "description": "Silhouette of a solitary wooden fishing boat on golden ocean swells at sunset.",
        "year": "2026"
    },
    "IMG_4506.jpeg": {
        "id": "wet-sand-reflections",
        "title": "Wet Sand Reflections",
        "chapter_num": 5,
        "chapter": "Chapter 5: Kotka Beach & Bay of Bengal",
        "category": "coast-kotka",
        "category_label": "Kotka & Coast",
        "waypoint_id": "wp-9",
        "destination": "Kotka Beach",
        "coordinates": "21.8465° N, 89.7850° E",
        "description": "Low tide sheen reflecting the late afternoon sky and distant breakers.",
        "year": "2026"
    },
    "IMG_4567.jpeg": {
        "id": "blue-hour-anchorage",
        "title": "Blue Hour at Kotka Anchorage",
        "chapter_num": 5,
        "chapter": "Chapter 5: Kotka Beach & Bay of Bengal",
        "category": "coast-kotka",
        "category_label": "Kotka & Coast",
        "waypoint_id": "wp-9",
        "destination": "Kotka Estuary",
        "coordinates": "21.8670° N, 89.7750° E",
        "description": "Deep blue hour over the anchorage with service dinghies tied along the shore and cruisers lit in the distance.",
        "year": "2026"
    },
    "IMG_4579.jpeg": {
        "id": "river-crossing-at-dusk",
        "title": "River Crossing at Dusk",
        "chapter_num": 5,
        "chapter": "Chapter 5: Kotka Beach & Bay of Bengal",
        "category": "coast-kotka",
        "category_label": "Kotka & Coast",
        "waypoint_id": "wp-9",
        "destination": "Kotka Channel",
        "coordinates": "21.8685° N, 89.7740° E",
        "description": "Expedition members in life vests returning to the main cruiser aboard a wooden tender at twilight.",
        "year": "2026"
    }
}

WAYPOINTS = [
    {
        "id": "wp-1",
        "num": "01",
        "title": "Highway Route N7",
        "region": "Dhaka to Southwest Corridor",
        "coordinates": "23.6052° N, 89.8407° E",
        "description": "Departure from Dhaka westward along Highway N7 toward the Padma delta crossing.",
        "photos_count": 1
    },
    {
        "id": "wp-2",
        "num": "02",
        "title": "Padma River & Paksey Bridges",
        "region": "Pabna / Kushtia Padma Basin",
        "coordinates": "24.0864° N, 89.0305° E",
        "description": "The historic crossing over the Padma River, featuring Hardinge Bridge, Lalon Shah Bridge, and the Rooppur horizon.",
        "photos_count": 2
    },
    {
        "id": "wp-3",
        "num": "03",
        "title": "Khulna University (Adomya Bangla)",
        "region": "Gallamari, Khulna",
        "coordinates": "22.8025° N, 89.5338° E",
        "description": "The iconic 'Adomya Bangla' 1971 Liberation War sculpture by Gopal Chandra Pal on the Khulna University campus.",
        "photos_count": 1
    },
    {
        "id": "wp-4",
        "num": "04",
        "title": "Rupsha River & Rail Bridge",
        "region": "Khulna Delta",
        "coordinates": "22.7831° N, 89.5872° E",
        "description": "Heavy steel rail viaducts, the new Rupsha Rail Bridge, submerged colonial brick ghats, and monsoon cloudscapes.",
        "photos_count": 6
    },
    {
        "id": "wp-5",
        "num": "05",
        "title": "Mongla Port & Tideway",
        "region": "Bagerhat / Mongla Harbor",
        "coordinates": "22.4858° N, 89.5936° E",
        "description": "Bangladesh Navy warship frigates and industrial grain silos along the tideway entrance to the Sundarbans.",
        "photos_count": 2
    },
    {
        "id": "wp-6",
        "num": "06",
        "title": "Aboard the Cruiser",
        "region": "Pashur River Channel",
        "coordinates": "22.3512° N, 89.6105° E",
        "description": "Navigation aboard 'The Sail', wheelhouse steering, searchlights, and lantern-lit promenade decks at night.",
        "photos_count": 5
    },
    {
        "id": "wp-7",
        "num": "07",
        "title": "Karamjal Wildlife Reserve",
        "region": "Northern Sundarbans Reserve",
        "coordinates": "22.4278° N, 89.5992° E",
        "description": "Observation watchtowers, prehistoric saltwater crocodiles, and breathing pneumatophore root systems.",
        "photos_count": 5
    },
    {
        "id": "wp-8",
        "num": "08",
        "title": "Harbaria Forest Creek",
        "region": "Interior Mangrove Tributaries",
        "coordinates": "22.3115° N, 89.6450° E",
        "description": "Golpata nypa palm canals, ancient woody lianas, wild Shapla water lilies, and local wooden tenders.",
        "photos_count": 5
    },
    {
        "id": "wp-9",
        "num": "09",
        "title": "Kotka Beach & Bay of Bengal",
        "region": "Southern Coastal Edge",
        "coordinates": "21.8480° N, 89.7845° E",
        "description": "Vast low-tide sandy beaches, sand bubbler crab mandalas, autumn Kashful reeds, eroded dead forest sentinels, and sunset over waves.",
        "photos_count": 11
    }
]

def sanitize_filename(orig_name):
    base = orig_name.replace(".jpeg", "").replace(".jpg", "")
    base = re.sub(r'[^a-zA-Z0-9_-]', '_', base)
    return base + ".jpg"

def get_image_info(filepath):
    cmd = ["sips", "-g", "pixelWidth", "-g", "pixelHeight", filepath]
    res = subprocess.run(cmd, capture_output=True, text=True)
    out = res.stdout
    w = 0
    h = 0
    for line in out.splitlines():
        line = line.strip()
        if line.startswith("pixelWidth:"):
            w = int(line.split(":")[1].strip())
        elif line.startswith("pixelHeight:"):
            h = int(line.split(":")[1].strip())
    return w, h

def process_image(orig_filename):
    src_path = os.path.join(BASE_DIR, orig_filename)
    safe_name = sanitize_filename(orig_filename)
    web_path = os.path.join(WEB_DIR, safe_name)
    thumb_path = os.path.join(THUMB_DIR, safe_name)
    
    w, h = get_image_info(web_path)
    aspect_ratio = round(w / h, 3) if h > 0 else 1.5
    orientation = "landscape" if aspect_ratio > 1.15 else ("portrait" if aspect_ratio < 0.85 else "square")
    
    meta = PHOTO_CATALOG.get(orig_filename, {})
    
    return {
        "id": meta.get("id", safe_name.replace(".jpg", "")),
        "filename": orig_filename,
        "safe_filename": safe_name,
        "web_src": f"assets/images/web/{safe_name}",
        "thumb_src": f"assets/images/thumbs/{safe_name}",
        "title": meta.get("title", safe_name),
        "chapter_num": meta.get("chapter_num", 1),
        "chapter": meta.get("chapter", "The Journey"),
        "category": meta.get("category", "all"),
        "category_label": meta.get("category_label", "All"),
        "waypoint_id": meta.get("waypoint_id", "wp-1"),
        "destination": meta.get("destination", "Sundarbans"),
        "coordinates": meta.get("coordinates", "22.0000° N, 89.6000° E"),
        "description": meta.get("description", ""),
        "year": meta.get("year", "2026"),
        "width": w,
        "height": h,
        "aspect_ratio": aspect_ratio,
        "orientation": orientation
    }

def main():
    jpeg_files = [f for f in os.listdir(BASE_DIR) if f.endswith(".jpeg") or f.endswith(".jpg")]
    jpeg_files = sorted(jpeg_files)
    
    photos = [process_image(f) for f in jpeg_files]
    photos.sort(key=lambda p: (p["chapter_num"], p["id"]))
    
    dataset = {
        "title": "Sundarbans",
        "subtitle": "Photographs from Dhaka through the southern delta to the Bay of Bengal.",
        "photographer": "Munasib Apurbo",
        "year": "2026",
        "total_photos": len(photos),
        "waypoints": WAYPOINTS,
        "categories": [
            {"id": "all", "label": "All"},
            {"id": "padma-road", "label": "Padma & Road"},
            {"id": "port-bridges", "label": "Khulna & Bridges"},
            {"id": "cruiser-life", "label": "Aboard Cruiser"},
            {"id": "mangrove-wild", "label": "Karamjal & Mangrove"},
            {"id": "coast-kotka", "label": "Kotka & Coast"}
        ],
        "photos": photos
    }
    
    with open(os.path.join(DATA_DIR, "photos.json"), "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
        
    with open(os.path.join(DATA_DIR, "photos.js"), "w", encoding="utf-8") as f:
        f.write("window.EXPEDITION_DATA = " + json.dumps(dataset, indent=2, ensure_ascii=False) + ";\n")
        
    print("Dataset successfully generated!")

if __name__ == "__main__":
    main()
