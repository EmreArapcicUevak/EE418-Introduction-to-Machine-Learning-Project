import osmnx as ox

from .poi_tags import POI_TAGS


def load_poi_data(place: str, force_reload: bool = False) -> dict:
    """
    Load POI data for a single configured place.

    Note:
    OSMnx handles caching of raw OSM feature queries internally.
    """

    poi_data = {}

    for name, tags in POI_TAGS.items():
        gdf = ox.features.features_from_place(place, tags)

        # OSMnx internally caches feature queries
        gdf = gdf.to_crs(epsg=32634)

        # Keep points & polygons only
        gdf = gdf[gdf.geometry.type.isin(["Point", "Polygon"])]

        # Convert polygons → centroids
        gdf["geometry"] = gdf.geometry.centroid

        poi_data[name] = gdf

    return poi_data
