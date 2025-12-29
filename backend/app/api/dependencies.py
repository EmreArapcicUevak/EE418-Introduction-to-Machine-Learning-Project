from fastapi import HTTPException, Request

def _get_attr(request: Request, name: str):
    """
    Internal helper to safely fetch app.state attributes.
    """
    value = getattr(request.app.state, name, None)
    if value is None:
        raise HTTPException(
            status_code=503,
            detail=f"{name} not loaded"
        )
    return value


def get_poi_data(request: Request):
    return _get_attr(request, "poi_data")


def get_sales_model(request: Request):
    return _get_attr(request, "sales_model")


def get_rentals_model(request: Request):
    return _get_attr(request, "rentals_model")
