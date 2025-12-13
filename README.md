# Sarajevo Flats Price Analysis

This project collects real estate data from Sarajevo online listings and performs regression analysis to predict apartment prices based on features like size, location, and other available attributes.

---

## Project Structure

```
sarajevo-flats/
│
├── README.md               # Project description and instructions
├── requirements.txt        # Python dependencies
├── .gitignore              # Files to ignore in Git
├── data/                   # Folder for scraped or cleaned datasets
│   └── sarajevo_flats.csv  # Scraped dataset
├── src/                    # Python scripts
│   ├── scrape.py           # Web scraping script using BeautifulSoup
│   ├── clean_data.py       # Optional: cleaning/preprocessing data
│   └── regression.py       # Regression model (train/test)
└── notebooks/              # Optional Jupyter notebooks for exploration
    └── exploration.ipynb
```

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/EmreArapcicUevak/EE418-Introduction-to-Machine-Learning-Project
cd EE418-Introduction-to-Machine-Learning-Project
```

2. Create a virtual environment (optional but recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Usage

### 1. Scrape data

Run the scraping script to collect apartment listings:

```bash
python src/scrape.py
```

This will save the dataset as `data/sarajevo_flats.csv`.

### 2. Clean / preprocess data (optional)

```bash
python src/clean_data.py
```

This script will format prices, sizes, and handle missing values.

### 3. Train regression model

```bash
python src/regression.py
```

This will train a regression model to predict apartment prices and display performance metrics.

---

## Dependencies

* Python 3.8+
* [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
* Requests
* Pandas
* Scikit-learn
* Lxml (parser for BeautifulSoup)

Install via:

```bash
pip install -r requirements.txt
```

---

## Data Quality Notes

### Geographic Boundaries

Some apartments may appear slightly outside strict Canton Sarajevo geographic boundaries when plotted on a map, but are retained in the dataset because:
- They have valid Canton Sarajevo municipality classifications
- They were scraped with the `canton=9` filter on OLX.ba
- Geographic boundary shapefiles may not perfectly align with administrative/market boundaries
- All affected listings have complete and valid feature sets

See `data/README.md` for detailed information about this data quality decision.

---

## Notes

* Scraped data is intended for **educational and research purposes only**.
* Web page structure may change; scraping scripts may need updates accordingly.
* CSV files are ignored in `.gitignore` to avoid large data in Git.

---

