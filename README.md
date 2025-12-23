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

### 2. Clean / preprocess data

The data cleaning pipeline implements principled transformations based on feature analysis:

```bash
python src/clean_data.py data/raw_input.csv data/cleaned_output.csv --verbose
```

This script applies the following transformations:
- Converts categorical variables to category dtype for efficiency
- Removes redundant columns (property_type with synonymous values)
- Fixes categorical outliers (removes incorrect condition values)
- Merges rare heating categories (Wood → Other)
- Removes municipalities with negligible representation (Ilijaš, Hadžići)
- Caps floor values labeled as "20+" to 20
- Removes rows with missing prices or rooms
- Drops latitude/longitude columns due to data quality concerns

For more details on the data cleaning rationale, see the [feature_analysis notebook](notebooks/feature_analysis.ipynb).

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

## Notes

* Scraped data is intended for **educational and research purposes only**.
* Web page structure may change; scraping scripts may need updates accordingly.
* CSV files are ignored in `.gitignore` to avoid large data in Git.

---

