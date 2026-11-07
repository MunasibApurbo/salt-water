import os
import subprocess
import json
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB_DIR = os.path.join(BASE_DIR, "assets/images/web")
THUMB_DIR = os.path.join(BASE_DIR, "assets/images/thumbs")
DATA_DIR = os.path.join(BASE_DIR, "assets/data")
RAW_PHOTOS_DIR = os.path.join(BASE_DIR, "_raw_media/photos")

os.makedirs(WEB_DIR, exist_ok=True)
os.makedirs(THUMB_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

PHOTO_CATALOG = {   'IMG_4036.jpeg': {   'category': 'padma-road',
                         'category_label': 'Padma & Road',
                         'chapter': 'Chapter 1: The Highway & Crossing',
                         'chapter_num': 1,
                         'coordinates': '23.6052° N, 89.8407° E',
                         'description': 'A lone streetlight cutting through the dusk along the N7 as the open road '
                                        'pushes south toward the river.',
                         'destination': 'Highway Route N7',
                         'id': 'highway-twilight',
                         'title': 'Highway at Twilight',
                         'waypoint_id': 'wp-1',
                         'year': '2026'},
    'IMG_4037.jpeg': {   'category': 'padma-road',
                         'category_label': 'Padma & Road',
                         'chapter': 'Chapter 1: The Highway & Crossing',
                         'chapter_num': 1,
                         'coordinates': '24.0864° N, 89.0305° E',
                         'description': "Hardinge Bridge's century-old riveted steel girders rising alongside the "
                                        'modern Lalon Shah span over the wide Padma sandbars.',
                         'destination': 'Paksey, Padma River',
                         'id': 'hardinge-lalon-shah-bridges',
                         'title': 'Hardinge & Lalon Shah Bridges',
                         'waypoint_id': 'wp-2',
                         'year': '2026'},
    'IMG_4094.jpeg': {   'category': 'padma-road',
                         'category_label': 'Padma & Road',
                         'chapter': 'Chapter 1: The Highway & Crossing',
                         'chapter_num': 1,
                         'coordinates': '24.0682° N, 89.0461° E',
                         'description': 'A solitary country boat resting on the exposed mud bank, with the distant '
                                        'concrete silhouette of the Rooppur cooling towers on the hazy horizon.',
                         'destination': 'Padma Riverbank',
                         'id': 'wooden-boat-rooppur',
                         'title': 'Wooden Boat & Rooppur Horizon',
                         'waypoint_id': 'wp-2',
                         'year': '2026'},
    'IMG_4169.jpeg': {   'category': 'cruiser-life',
                         'category_label': 'Aboard Cruiser',
                         'chapter': 'Chapter 3: Life Aboard the Cruiser',
                         'chapter_num': 3,
                         'coordinates': '22.3512° N, 89.6105° E',
                         'description': 'Gauzy white curtains framing the quiet, steady rhythm of passing mudflats and '
                                        'distant palm trees.',
                         'destination': 'Pashur River',
                         'id': 'cabin-window-view',
                         'title': 'Cabin Window View',
                         'waypoint_id': 'wp-6',
                         'year': '2026'},
    'IMG_4188.jpeg': {   'category': 'cruiser-life',
                         'category_label': 'Aboard Cruiser',
                         'chapter': 'Chapter 3: Life Aboard the Cruiser',
                         'chapter_num': 3,
                         'coordinates': '22.3120° N, 89.6234° E',
                         'description': "'The Sail' cruising alongside us down the wide, brown channel of the Pashur "
                                        'River.',
                         'destination': 'Pashur Channel',
                         'id': 'cruiser-the-sail-convoy',
                         'title': "Cruiser 'The Sail' in Convoy",
                         'waypoint_id': 'wp-6',
                         'year': '2026'},
    'IMG_4190.jpeg': {   'category': 'cruiser-life',
                         'category_label': 'Aboard Cruiser',
                         'chapter': 'Chapter 3: Life Aboard the Cruiser',
                         'chapter_num': 3,
                         'coordinates': '22.2891° N, 89.6350° E',
                         'description': 'Rooftop searchlights mounted on the observation deck, ready to cut through '
                                        'the river fog and night mist.',
                         'destination': 'Cruiser Upper Deck',
                         'id': 'searchlights-observation-deck',
                         'title': 'Searchlights on the Observation Deck',
                         'waypoint_id': 'wp-6',
                         'year': '2026'},
    'IMG_4212.jpeg': {   'category': 'mangrove-wild',
                         'category_label': 'Karamjal & Mangrove',
                         'chapter': 'Chapter 4: Karamjal & Mangrove Reserve',
                         'chapter_num': 4,
                         'coordinates': '22.4278° N, 89.5992° E',
                         'description': 'Stepping onto the boardwalk at Karamjal, where soft tidal mud gives way to '
                                        'the dense tangled forest.',
                         'destination': 'Karamjal Eco Park',
                         'id': 'karamjal-mangrove-boundary',
                         'title': 'Karamjal Mangrove Boundary',
                         'waypoint_id': 'wp-7',
                         'year': '2026'},
    'IMG_4222.jpeg': {   'category': 'mangrove-wild',
                         'category_label': 'Karamjal & Mangrove',
                         'chapter': 'Chapter 4: Karamjal & Mangrove Reserve',
                         'chapter_num': 4,
                         'coordinates': '22.4285° N, 89.5980° E',
                         'description': 'Dense fields of spike roots pushing straight up through the silty mud to '
                                        'breathe while the tide is out.',
                         'destination': 'Karamjal Understory',
                         'id': 'pneumatophore-roots',
                         'title': 'Pneumatophore Breathing Roots',
                         'waypoint_id': 'wp-7',
                         'year': '2026'},
    'IMG_4229.jpeg': {   'category': 'mangrove-wild',
                         'category_label': 'Karamjal & Mangrove',
                         'chapter': 'Chapter 4: Karamjal & Mangrove Reserve',
                         'chapter_num': 4,
                         'coordinates': '22.4150° N, 89.6050° E',
                         'description': 'Thick twisted jungle lianas trailing down to touch the mirror surface of a '
                                        'narrow forest creek.',
                         'destination': 'Mangrove Canal',
                         'id': 'lianas-over-creek',
                         'title': 'Lianas Reflected in Creek',
                         'waypoint_id': 'wp-8',
                         'year': '2026'},
    'IMG_4235.jpeg': {   'category': 'mangrove-wild',
                         'category_label': 'Karamjal & Mangrove',
                         'chapter': 'Chapter 4: Karamjal & Mangrove Reserve',
                         'chapter_num': 4,
                         'coordinates': '22.4290° N, 89.5985° E',
                         'description': 'The wooden watchtower rising through the thick humid air, offering a rare '
                                        'view over the dense mangrove canopy.',
                         'destination': 'Karamjal Reserve',
                         'id': 'observation-watchtower',
                         'title': 'Observation Watchtower',
                         'waypoint_id': 'wp-7',
                         'year': '2026'},
    'IMG_4239(1).jpeg': {   'category': 'coast-kotka',
                            'category_label': 'Kotka & Coast',
                            'chapter': 'Chapter 5: Kotka Beach & Bay of Bengal',
                            'chapter_num': 5,
                            'coordinates': '21.8492° N, 89.7815° E',
                            'description': 'Salt-bleached mangrove stumps standing firm against the breaking waves, '
                                           'marking where the shoreline used to be.',
                            'destination': 'Kotka Dead Forest Beach',
                            'id': 'eroded-mangrove-stumps',
                            'title': 'Eroded Mangrove Stumps',
                            'waypoint_id': 'wp-9',
                            'year': '2026'},
    'IMG_4239.jpeg': {   'category': 'mangrove-wild',
                         'category_label': 'Karamjal & Mangrove',
                         'chapter': 'Chapter 4: Karamjal & Mangrove Reserve',
                         'chapter_num': 4,
                         'coordinates': '22.4291° N, 89.5987° E',
                         'description': 'Looking out from high on the watchtower across miles of unbroken green canopy '
                                        'and winding tidal channels.',
                         'destination': 'Karamjal Summit',
                         'id': 'canopy-panorama-tower',
                         'title': 'Canopy Panorama from Tower',
                         'waypoint_id': 'wp-7',
                         'year': '2026'},
    'IMG_4251.jpeg': {   'category': 'mangrove-wild',
                         'category_label': 'Karamjal & Mangrove',
                         'chapter': 'Chapter 4: Karamjal & Mangrove Reserve',
                         'chapter_num': 4,
                         'coordinates': '22.3115° N, 89.6450° E',
                         'description': 'Massive arching fronds of wild golpata palms dipping into the channel above '
                                        'our wooden dinghy.',
                         'destination': 'Harbaria Creek',
                         'id': 'golpata-palms-dinghy',
                         'title': 'Golpata Palms & Moored Dinghy',
                         'waypoint_id': 'wp-8',
                         'year': '2026'},
    'IMG_4319.jpeg': {   'category': 'mangrove-wild',
                         'category_label': 'Karamjal & Mangrove',
                         'chapter': 'Chapter 4: Karamjal & Mangrove Reserve',
                         'chapter_num': 4,
                         'coordinates': '22.3100° N, 89.6470° E',
                         'description': 'Our boatman perched at the bow of the wooden tender, squinting into the '
                                        'afternoon sun with an easy smile.',
                         'destination': 'Tidal Canal',
                         'id': 'boatman-at-the-bow',
                         'title': 'River Boatman',
                         'waypoint_id': 'wp-8',
                         'year': '2026'},
    'IMG_4424.jpeg': {   'category': 'mangrove-wild',
                         'category_label': 'Karamjal & Mangrove',
                         'chapter': 'Chapter 4: Karamjal & Mangrove Reserve',
                         'chapter_num': 4,
                         'coordinates': '22.3140° N, 89.6465° E',
                         'description': 'A wild white shapla blooming quietly on the surface of a small freshwater '
                                        'pond tucked inside the forest.',
                         'destination': 'Harbaria Pond',
                         'id': 'wild-water-lily-shapla',
                         'title': 'Wild Water Lily (Shapla)',
                         'waypoint_id': 'wp-8',
                         'year': '2026'},
    'IMG_4426.jpeg': {   'category': 'mangrove-wild',
                         'category_label': 'Karamjal & Mangrove',
                         'chapter': 'Chapter 4: Karamjal & Mangrove Reserve',
                         'chapter_num': 4,
                         'coordinates': '22.3080° N, 89.6490° E',
                         'description': 'Looking straight up into the high interlocking branches of Sundari trees '
                                        'filtering the warm afternoon light.',
                         'destination': 'Deep Forest',
                         'id': 'sundari-tree-canopy',
                         'title': 'Sundari Tree Canopy',
                         'waypoint_id': 'wp-8',
                         'year': '2026'},
    'IMG_4433.jpeg': {   'category': 'mangrove-wild',
                         'category_label': 'Karamjal & Mangrove',
                         'chapter': 'Chapter 4: Karamjal & Mangrove Reserve',
                         'chapter_num': 4,
                         'coordinates': '22.2540° N, 89.6670° E',
                         'description': 'Wooden sea-fishing trawlers moored side-by-side along the mud bank, waiting '
                                        'for the ocean tide to turn.',
                         'destination': "Fishermen's Bank",
                         'id': 'moored-fishing-trawlers',
                         'title': 'Moored Fishing Trawlers',
                         'waypoint_id': 'wp-8',
                         'year': '2026'},
    'IMG_4440.jpeg': {   'category': 'coast-kotka',
                         'category_label': 'Kotka & Coast',
                         'chapter': 'Chapter 5: Kotka Beach & Bay of Bengal',
                         'chapter_num': 5,
                         'coordinates': '21.8652° N, 89.7785° E',
                         'description': 'White plumes of wild kashful swaying across the open coastal meadows as the '
                                        'forest opens to the sea.',
                         'destination': 'Kotka Trail',
                         'id': 'kashful-meadow',
                         'title': 'Kashful Meadow',
                         'waypoint_id': 'wp-9',
                         'year': '2026'},
    'IMG_4442.jpeg': {   'category': 'coast-kotka',
                         'category_label': 'Kotka & Coast',
                         'chapter': 'Chapter 5: Kotka Beach & Bay of Bengal',
                         'chapter_num': 5,
                         'coordinates': '21.8640° N, 89.7790° E',
                         'description': 'Delicate white kashful silks glowing in the late afternoon sun, bending with '
                                        'the sea breeze.',
                         'destination': 'Kotka Meadow',
                         'id': 'kashful-reeds-closeup',
                         'title': 'Kashful Reeds Close-Up',
                         'waypoint_id': 'wp-9',
                         'year': '2026'},
    'IMG_4463.jpeg': {   'category': 'coast-kotka',
                         'category_label': 'Kotka & Coast',
                         'chapter': 'Chapter 5: Kotka Beach & Bay of Bengal',
                         'chapter_num': 5,
                         'coordinates': '21.8510° N, 89.7820° E',
                         'description': 'Thousands of tiny sand pellets arranged in delicate radial spirals, left '
                                        'behind by sand bubbler crabs at low tide.',
                         'destination': 'Jamtola Beach',
                         'id': 'sand-bubbler-crab-patterns',
                         'title': 'Sand Bubbler Crab Patterns',
                         'waypoint_id': 'wp-9',
                         'year': '2026'},
    'IMG_4465.jpeg': {   'category': 'coast-kotka',
                         'category_label': 'Kotka & Coast',
                         'chapter': 'Chapter 5: Kotka Beach & Bay of Bengal',
                         'chapter_num': 5,
                         'coordinates': '21.8480° N, 89.7845° E',
                         'description': 'The vast open expanse of Jamtola Beach at low tide, stretching out toward the '
                                        'horizon where land finally ends.',
                         'destination': 'Bay of Bengal Coast',
                         'id': 'jamtola-sea-beach',
                         'title': 'Jamtola Sea Beach at Low Tide',
                         'waypoint_id': 'wp-9',
                         'year': '2026'},
    'IMG_4466.jpeg': {   'category': 'coast-kotka',
                         'category_label': 'Kotka & Coast',
                         'chapter': 'Chapter 5: Kotka Beach & Bay of Bengal',
                         'chapter_num': 5,
                         'coordinates': '21.8505° N, 89.7830° E',
                         'description': 'The forest meeting the sea: hardy mangroves standing right at the high-tide '
                                        'line where surf breaks against the trees.',
                         'destination': 'Kotka Shoreline',
                         'id': 'mangrove-coastal-edge',
                         'title': 'Mangrove Edge along Shore',
                         'waypoint_id': 'wp-9',
                         'year': '2026'},
    'IMG_4502.jpeg': {   'category': 'coast-kotka',
                         'category_label': 'Kotka & Coast',
                         'chapter': 'Chapter 5: Kotka Beach & Bay of Bengal',
                         'chapter_num': 5,
                         'coordinates': '21.8450° N, 89.7860° E',
                         'description': 'A solitary wooden fishing boat silhouetted against the glowing amber water as '
                                        'the sun sinks into the bay.',
                         'destination': 'Bay of Bengal',
                         'id': 'fishing-boat-sunset',
                         'title': 'Fishing Boat at Sunset',
                         'waypoint_id': 'wp-9',
                         'year': '2026'},
    'IMG_4506.jpeg': {   'category': 'coast-kotka',
                         'category_label': 'Kotka & Coast',
                         'chapter': 'Chapter 5: Kotka Beach & Bay of Bengal',
                         'chapter_num': 5,
                         'coordinates': '21.8465° N, 89.7850° E',
                         'description': 'A thin sheet of tide water turning the beach into a mirror, reflecting the '
                                        'soft overcast sky and distant breakers.',
                         'destination': 'Kotka Beach',
                         'id': 'wet-sand-reflections',
                         'title': 'Wet Sand Reflections',
                         'waypoint_id': 'wp-9',
                         'year': '2026'},
    'IMG_4567.jpeg': {   'category': 'coast-kotka',
                         'category_label': 'Kotka & Coast',
                         'chapter': 'Chapter 5: Kotka Beach & Bay of Bengal',
                         'chapter_num': 5,
                         'coordinates': '21.8670° N, 89.7750° E',
                         'description': 'Deep blue hour falling over the anchorage, with tenders tied along the bank '
                                        'and warm cabin lights reflecting in the water.',
                         'destination': 'Kotka Estuary',
                         'id': 'blue-hour-anchorage',
                         'title': 'Blue Hour at Kotka Anchorage',
                         'waypoint_id': 'wp-9',
                         'year': '2026'},
    'IMG_4579.jpeg': {   'category': 'coast-kotka',
                         'category_label': 'Kotka & Coast',
                         'chapter': 'Chapter 5: Kotka Beach & Bay of Bengal',
                         'chapter_num': 5,
                         'coordinates': '21.8685° N, 89.7740° E',
                         'description': 'Heading back to the main cruiser in a wooden tender at dusk, orange life '
                                        'jackets standing out against the purple river.',
                         'destination': 'Kotka Channel',
                         'id': 'river-crossing-at-dusk',
                         'title': 'River Crossing at Dusk',
                         'waypoint_id': 'wp-9',
                         'year': '2026'},
    'IMG_4594.jpeg': {   'category': 'cruiser-life',
                         'category_label': 'Aboard Cruiser',
                         'chapter': 'Chapter 3: Life Aboard the Cruiser',
                         'chapter_num': 3,
                         'coordinates': '22.0210° N, 89.6820° E',
                         'description': 'Warm incandescent bulbs glowing over the wooden deck planks as the ship '
                                        'settles into its quiet night anchorage.',
                         'destination': 'Cruiser Anchorage',
                         'id': 'promenade-deck-night',
                         'title': 'Promenade Deck at Night',
                         'waypoint_id': 'wp-6',
                         'year': '2026'},
    'IMG_4598.jpeg': {   'category': 'mangrove-wild',
                         'category_label': 'Karamjal & Mangrove',
                         'chapter': 'Chapter 4: Karamjal & Mangrove Reserve',
                         'chapter_num': 4,
                         'coordinates': '22.4282° N, 89.5995° E',
                         'description': 'A saltwater crocodile lying completely still on the muddy bank, blanketed in '
                                        'a bright coat of duckweed.',
                         'destination': 'Karamjal Sanctuary',
                         'id': 'saltwater-crocodile',
                         'title': 'Saltwater Crocodile in Duckweed',
                         'waypoint_id': 'wp-7',
                         'year': '2026'},
    'IMG_4613.jpeg': {   'category': 'port-bridges',
                         'category_label': 'Khulna & Bridges',
                         'chapter': 'Chapter 2: Khulna & Delta Bridges',
                         'chapter_num': 2,
                         'coordinates': '22.4858° N, 89.5936° E',
                         'description': 'Navy frigates moored along the tidal quayside at Mongla, their steel hulls '
                                        'gray against the muddy channel.',
                         'destination': 'Mongla Port',
                         'id': 'navy-frigates-mongla',
                         'title': 'Navy Frigates at Mongla Port',
                         'waypoint_id': 'wp-5',
                         'year': '2026'},
    'IMG_4639.jpeg': {   'category': 'port-bridges',
                         'category_label': 'Khulna & Bridges',
                         'chapter': 'Chapter 2: Khulna & Delta Bridges',
                         'chapter_num': 2,
                         'coordinates': '22.5210° N, 89.6015° E',
                         'description': 'Tall grain silos and conveyors towering over loaded cargo barges moored along '
                                        'the riverbank.',
                         'destination': 'Pashur River',
                         'id': 'pashur-silos-barges',
                         'title': 'Pashur River Silos & Barges',
                         'waypoint_id': 'wp-5',
                         'year': '2026'},
    'IMG_4642.jpeg': {   'category': 'cruiser-life',
                         'category_label': 'Aboard Cruiser',
                         'chapter': 'Chapter 3: Life Aboard the Cruiser',
                         'chapter_num': 3,
                         'coordinates': '22.2405° N, 89.6540° E',
                         'description': 'The captain in the wheelhouse, hands steady on the polished wooden spokes as '
                                        'he steers by reading the current.',
                         'destination': 'Wheelhouse',
                         'id': 'captain-at-the-helm',
                         'title': 'Captain at the Wooden Helm',
                         'waypoint_id': 'wp-6',
                         'year': '2026'},
    'IMG_4661.jpeg': {   'category': 'port-bridges',
                         'category_label': 'Khulna & Bridges',
                         'chapter': 'Chapter 2: Khulna & Delta Bridges',
                         'chapter_num': 2,
                         'coordinates': '22.6120° N, 89.6432° E',
                         'description': 'High-voltage pylons striding across the flooded southern marshlands—the final '
                                        'traces of the grid before the forest.',
                         'destination': 'Bagerhat Wetlands',
                         'id': 'transmission-towers-wetlands',
                         'title': 'Transmission Towers over Wetlands',
                         'waypoint_id': 'wp-4',
                         'year': '2026'},
    'IMG_4675.jpeg': {   'category': 'port-bridges',
                         'category_label': 'Khulna & Bridges',
                         'chapter': 'Chapter 2: Khulna & Delta Bridges',
                         'chapter_num': 2,
                         'coordinates': '22.7831° N, 89.5872° E',
                         'description': 'The geometric web of heavy riveted steel trusses beneath the new railway '
                                        'bridge against a moody sky.',
                         'destination': 'Rupsha River, Khulna',
                         'id': 'rupsha-bridge-truss',
                         'title': 'Rupsha Rail Bridge Truss',
                         'waypoint_id': 'wp-4',
                         'year': '2026'},
    'IMG_4680.jpeg': {   'category': 'port-bridges',
                         'category_label': 'Khulna & Bridges',
                         'chapter': 'Chapter 2: Khulna & Delta Bridges',
                         'chapter_num': 2,
                         'coordinates': '22.7845° N, 89.5880° E',
                         'description': 'Looking across the immense blue steel spans of the Rupsha rail bridge, '
                                        'connecting the delta rail network.',
                         'destination': 'Rupsha River, Khulna',
                         'id': 'rupsha-bridge-span',
                         'title': 'Rupsha Rail Bridge Over River',
                         'waypoint_id': 'wp-4',
                         'year': '2026'},
    'IMG_4682.jpeg': {   'category': 'port-bridges',
                         'category_label': 'Khulna & Bridges',
                         'chapter': 'Chapter 2: Khulna & Delta Bridges',
                         'chapter_num': 2,
                         'coordinates': '22.7820° N, 89.5865° E',
                         'description': 'Standing directly beneath the massive concrete piers and elevated viaduct '
                                        'beams of the railway approach.',
                         'destination': 'Khulna',
                         'id': 'under-rupsha-viaduct',
                         'title': 'Under the Rupsha Viaduct',
                         'waypoint_id': 'wp-4',
                         'year': '2026'},
    'IMG_4691.jpeg': {   'category': 'port-bridges',
                         'category_label': 'Khulna & Bridges',
                         'chapter': 'Chapter 2: Khulna & Delta Bridges',
                         'chapter_num': 2,
                         'coordinates': '22.7650° N, 89.5912° E',
                         'description': 'Old weathered brick steps slipping under the silty river as the brackish '
                                        'midday tide sweeps in.',
                         'destination': 'Rupsha River',
                         'id': 'submerged-brick-ghat',
                         'title': 'Submerged Brick Ghat',
                         'waypoint_id': 'wp-4',
                         'year': '2026'},
    'IMG_4694.jpeg': {   'category': 'port-bridges',
                         'category_label': 'Khulna & Bridges',
                         'chapter': 'Chapter 2: Khulna & Delta Bridges',
                         'chapter_num': 2,
                         'coordinates': '22.7912° N, 89.5740° E',
                         'description': 'A towering monsoon thunderhead building quietly over the palms and flooded '
                                        'fields outside Khulna.',
                         'destination': 'Khulna Outskirts',
                         'id': 'monsoon-cloudscape',
                         'title': 'Monsoon Cloudscape',
                         'waypoint_id': 'wp-4',
                         'year': '2026'},
    'IMG_4709.jpeg': {   'category': 'padma-road',
                         'category_label': 'Padma & Road',
                         'chapter': 'Chapter 1: The Highway & Crossing',
                         'chapter_num': 1,
                         'coordinates': '22.8025° N, 89.5338° E',
                         'description': "The dramatic angles of the 'Adomya Bangla' monument at Khulna University, "
                                        'commemorating the 1971 Liberation War against an open sky.',
                         'destination': 'Khulna University, Gallamari',
                         'id': 'adomya-bangla-khulna-university',
                         'title': 'Adomya Bangla Sculpture',
                         'waypoint_id': 'wp-3',
                         'year': '2026'}}

WAYPOINTS = [   {   'coordinates': '23.6052° N, 89.8407° E',
        'description': 'Leaving Dhaka behind on Highway N7, watching the city sprawl dissolve into farmland and open '
                       'sky on the road south.',
        'id': 'wp-1',
        'num': '01',
        'photos_count': 1,
        'region': 'Dhaka to Southwest Corridor',
        'title': 'Highway Route N7'},
    {   'coordinates': '24.0864° N, 89.0305° E',
        'description': 'Crossing the wide Padma at Paksey, where a century of iron railway heritage stands alongside '
                       'modern bridges and quiet silt banks.',
        'id': 'wp-2',
        'num': '02',
        'photos_count': 2,
        'region': 'Pabna / Kushtia Padma Basin',
        'title': 'Padma River & Paksey Bridges'},
    {   'coordinates': '22.8025° N, 89.5338° E',
        'description': 'A brief stop at Khulna University before heading down to the water, beneath the soaring lines '
                       'of the 1971 monument.',
        'id': 'wp-3',
        'num': '03',
        'photos_count': 1,
        'region': 'Gallamari, Khulna',
        'title': 'Khulna University (Adomya Bangla)'},
    {   'coordinates': '22.7831° N, 89.5872° E',
        'description': 'Where the city meets the river. Old brick bathing steps slipping under the tide while heavy '
                       'railway steel cuts across the monsoon clouds.',
        'id': 'wp-4',
        'num': '04',
        'photos_count': 6,
        'region': 'Khulna Delta',
        'title': 'Rupsha River & Rail Bridge'},
    {   'coordinates': '22.4858° N, 89.5936° E',
        'description': 'The busy industrial threshold at Mongla harbor—naval frigates at the quayside, towering silos, '
                       'and the first true taste of salt in the air.',
        'id': 'wp-5',
        'num': '05',
        'photos_count': 2,
        'region': 'Bagerhat / Mongla Harbor',
        'title': 'Mongla Port & Tideway'},
    {   'coordinates': '22.3512° N, 89.6105° E',
        'description': 'Life aboard the river cruiser. The steady thrum of the engine, steering by eye in the '
                       'wheelhouse, and sitting on the wooden deck under pitch-black night skies.',
        'id': 'wp-6',
        'num': '06',
        'photos_count': 5,
        'region': 'Pashur River Channel',
        'title': 'Aboard the Cruiser'},
    {   'coordinates': '22.4278° N, 89.5992° E',
        'description': 'The northern gate of the forest. Climbing high above the canopy for a rare open horizon, and '
                       'walking among the spiky breathing roots below.',
        'id': 'wp-7',
        'num': '07',
        'photos_count': 5,
        'region': 'Northern Sundarbans Reserve',
        'title': 'Karamjal Wildlife Reserve'},
    {   'coordinates': '22.3115° N, 89.6450° E',
        'description': 'Drifting through narrow tidal canals in a country dinghy, surrounded by thick hanging lianas, '
                       'nypa palms, and quiet freshwater pools.',
        'id': 'wp-8',
        'num': '08',
        'photos_count': 5,
        'region': 'Interior Mangrove Tributaries',
        'title': 'Harbaria Forest Creek'},
    {   'coordinates': '21.8480° N, 89.7845° E',
        'description': 'The final southern edge where the forest dissolves into the ocean. Miles of wet sand '
                       'reflecting the sky, wild reeds in the wind, and open sea.',
        'id': 'wp-9',
        'num': '09',
        'photos_count': 11,
        'region': 'Southern Coastal Edge',
        'title': 'Kotka Beach & Bay of Bengal'}]

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

def process_image(orig_filename, source_dir=None):
    if source_dir is None:
        source_dir = RAW_PHOTOS_DIR if os.path.isdir(RAW_PHOTOS_DIR) else BASE_DIR
    src_path = os.path.join(source_dir, orig_filename)
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
    source_dir = RAW_PHOTOS_DIR if os.path.isdir(RAW_PHOTOS_DIR) else BASE_DIR
    jpeg_files = [f for f in os.listdir(source_dir) if f.endswith(".jpeg") or f.endswith(".jpg")]
    jpeg_files = sorted(jpeg_files)
    
    photos = [process_image(f, source_dir) for f in jpeg_files]
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
