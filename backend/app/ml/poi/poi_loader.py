import joblib
import os
import osmnx as ox

from .poi_tags import POI_TAGS

CACHE_PATH = os.path.join(
    os.path.dirname(__file__),
    "poi_data.joblib"
)

def load_poi_data(place: str, force_reload: bool = False) -> dict:
    """
    force_reload: set True to rebuild cache
    """

    # Load from cache if exists
    if os.path.exists(CACHE_PATH) and not force_reload:
        print("Loading POI data from cache")
        return joblib.load(CACHE_PATH)

    print("Downloading POI data from OpenStreetMap")

    poi_data = {}

    for name, tags in POI_TAGS.items():
        gdf = ox.features.features_from_place(place, tags)
        gdf = gdf.to_crs(epsg=32634)

        # Keep points & polygons only
        gdf = gdf[gdf.geometry.type.isin(["Point", "Polygon"])]

        # Convert polygons → centroids
        gdf["geometry"] = gdf.geometry.centroid

        poi_data[name] = gdf

    # Cache
    joblib.dump(poi_data, CACHE_PATH)
    print("POI data cached to disk")

    return poi_data
