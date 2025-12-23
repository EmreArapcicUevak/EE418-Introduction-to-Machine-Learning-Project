def predict_price(input_data: dict) -> float:
    # temporary dummy logic
    base_price = 2000  # BAM per m2 (example)
    return input_data["square_m2"] * base_price
