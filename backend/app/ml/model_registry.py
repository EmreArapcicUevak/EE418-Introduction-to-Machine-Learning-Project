def get_model_by_ad_type(ad_type, sales_model, rentals_model):
    # Accept either string or Enum and normalize to lowercase string
    key = getattr(ad_type, "value", ad_type)
    key = str(key).casefold()

    if key == "sale":
        return sales_model
    if key == "rent":
        return rentals_model

    raise ValueError(f"Unsupported ad_type: {ad_type}")
