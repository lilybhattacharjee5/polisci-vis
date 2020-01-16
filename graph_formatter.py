import pandas as pd
import json
import random

nodes = []
links = []

web_ranking_pairs = pd.read_csv("home_bias_2019-06-15.csv")

countries = web_ranking_pairs["country1"].unique()
country_ids = dict(zip(countries, [i for i in range(len(countries))]))
id_countries = dict(zip([i for i in range(len(countries))], countries))
for c in countries:
    nodes.append({"character": c, "id": country_ids[c], "influence": random.randint(1, 100)})

for i in range(len(countries)):
    country1 = countries[i]
    for j in range(i + 1, len(countries)):
        country2 = countries[j]
        pair_row = web_ranking_pairs.loc[(web_ranking_pairs["country1"] == country1) & (web_ranking_pairs["country2"] == country2)]
        links.append({
            "source": i,
            "target": j,
            "weight": int(pair_row.iloc[0].pairwise_levenshtein)
        })

with open("graph_data_2019-06-15.json", "a") as file:
    graph_dict = {"nodes": nodes, "links": links}
    result = json.dumps(graph_dict)
    file.write(result)
