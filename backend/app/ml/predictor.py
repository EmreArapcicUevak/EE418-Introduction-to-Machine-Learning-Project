def predict_price(model, features) -> float:
    price = model.predict(features)[0]
    return float(price)
