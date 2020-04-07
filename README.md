# Internationally Blocked Domains Demo
The code in this repo generates an interactive demo that allows the user to select a country on a world map to visualize common web domains blocked in other countries. The page includes the following features:
- world map colored according to similarity index values associated with the selected country
- blocked domains data table for selected country (columns: country, count, similarity, domains)
The similarity index that defines the colors of the other countries e.g some Country B on the map when a country is selected (Country A) and the corresponding value in the data table is calculated using the following formula:
<p align = "center"><img src="https://render.githubusercontent.com/render/math?math=\frac{\text{number of unique common blocked domains in Country A AND Country B}}{\text{total number of unique domains blocked by Country A OR Country B}}"></p>

Below are explanations of key folders / files:
- local_country_variables/ : contains a JS file with a list of all countries included in the demo and a JS file with a list of all GDPR countries to prevent multiple unnecessary loads / data file reading delay in the page scripts
- notebooks/ : contains raw and cleaned data, and starting IPython analysis
  - cleaned_data/ : contains domain data scraped from URLs in Acknowledgements (see `scrape-blocked-websites.ipynb`)
  - common_domains/ : contains subsets of rows from combined_similarities.json in a more readable CSV format, corresponding to specific countries (see `preliminary_blocked_site_overlap.ipynb`)
    - Country 1: selected country
    - Country 2: can be any of the unselected countries with some shared blocked domain
    - Domain: top-level domain of blocked site (extracted with Python library `tldextract`)
    - Suffix: e.g. 'com', 'edu', etc.
- combined_similarities.json : initially-loaded file with country-specific similarity data to generate map colors
- index.html : main demo page

## Getting Started
To run the web server locally, download the repo and enter the main directory containing "index.html." Run `npm start` and access either the local or network links.

To view the public copy of the demo, click [here](https://pair-interoperability-demo.herokuapp.com/).

## License
BSD-3

## Acknowledgements
The following links / sources were used to generate the domain data for currently-enabled countries:
- [Iraq](https://www.theregister.co.uk/2014/07/01/revealed_the_great_firewall_of_iraq/) -- updated 2014
- [China](https://cyber.harvard.edu/filtering/china/) -- updated 2002
- [Saudi Arabia](https://cyber.harvard.edu/filtering/saudiarabia/) -- updated 2002
- [India](https://www.medianama.com/2012/05/223-isp-wise-list-of-blocked-sites-indiablocks/) -- updated 2012
- [Russia](https://web.archive.org/web/20140710063312/http://www.antizapret.info/) -- updated 2014
- [All EU Nations](https://data.verifiedjoseph.com/dataset/websites-not-available-eu-gdpr) -- updated 2019
-- Note: This visualization currently applies GDPR regulations to the UK. According to several sources, including [IT Governance](https://www.itgovernance.co.uk/eu-gdpr-uk-dpa-2018-uk-gdpr), EU GDPR will continue to apply to the UK until the Brexit transition period ends, at which point a UK GDPR may be negotiated.
- [Pakistan](https://propakistani.pk/wp-content/uploads/2010/05/blocked.html) -- updated 2010
- [United Arab Emirates](https://pastehtml.com/view/c3321xhl7.rtxt) (leaked by Anonymous) -- updated 2012

The following country data will be integrated in the future:
- [North Korea](https://www.npr.org/sections/thetwo-way/2016/09/21/494902997/north-korea-accidentally-reveals-it-only-has-28-websites) -- updated 2016

⚠️ <b>Note</b>: A current major issue with the demo is the use of old datasets (e.g. China, Saudi Arabia), and non-overlapping timeframes for datasets from different countries making comparisons between countries with this data less meaningful. Finding more recent datasets for all enabled countries is a high priority.
