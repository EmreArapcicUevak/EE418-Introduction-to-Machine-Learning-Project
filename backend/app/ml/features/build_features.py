import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

def build_features_from_request(req, poi_data):
    point = Point(req.longitude, req.latitude)
    point = gpd.GeoSeries([point], crs="EPSG:4326").to_crs(epsg=32634).iloc[0]

    features = {
        "condition": req.condition,
        "rooms": req.rooms,
        "square_m2": req.square_m2,
        "equipment": req.equipment,
        "level": req.level,
        "heating": req.heating,
    }

    for poi_name, pois in poi_data.items():
        col = f"closest_{poi_name}_m"
        idx = pois.sindex.nearest(point, 1)[1][0]
        features[col] = point.distance(pois.geometry.iloc[idx])

    return pd.DataFrame([features])
