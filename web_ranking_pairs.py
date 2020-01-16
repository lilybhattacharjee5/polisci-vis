import pandas as pd
from textdistance import levenshtein

rankings = pd.read_csv("global-alexa-rankings-2019-06-15.csv")
num_sites = len(rankings.groupby('url').count())
rankings['url_code'] =\
    rankings['url'].astype('category').cat.rename_categories(range(num_sites))

def as_string (country_ranking):
    '''
    Encodes top-ranked countries as a list of codes, where each code relates to a url.
    Returns a list of integers.
    '''
    return country_ranking['url_code'].tolist()

results = []
grouped_rankings = list(rankings.groupby('country_name'))

for i in range(len(grouped_rankings)):
    country1, group1 = grouped_rankings[i]
    country1_rankings = as_string(group1)
    for j in range(i + 1, len(grouped_rankings)):
        country2, group2 = grouped_rankings[j]
        country2_rankings = as_string(group2)
        if country1 != 'Global' and country2 != 'Global':
            results += [{
                'country1': country1,
                'country2': country2,
                'pairwise_levenshtein':\
                    levenshtein.distance(country1_rankings, country2_rankings),
            }]
results = pd.DataFrame(results)

results.to_csv("home_bias_2019-06-15.csv")
