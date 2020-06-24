# Data

This directory contains cleaned ICLab data in a simple file format that can be parsed by the public demo frontend, and powers the demo's world map and force graphs.

File format:
```
{
  country_code_alpha3_A : {
    country_code_alpha3_B_1 : {
      similarity: [float],
      domains: [list of strings],
      ...
    },
    country_code_alpha3_B_2 : {
      similarity: [float],
      domains: [list of strings],
      ...
    },
  }
}
```

In the snippet above, the labels mean the following:
- `country_code_alpha3_A` : one of the countries in a similarity pair, and in the context of the demo, the country that is currently selected in the world map (use 3-letter country code only)
- `country_code_alpha3_B_x`: there are many such 'Country B' entries per 'Country A', and there is generally 1 entry per dataset country with a nonzero number of filtered rows (use 3-letter country code only)
- `similarity` : similarity index corresponding to country pair interoperability
- `domains` : not a required property, but an example of how additional properties can be passed into the frontend

Currently, the only required property per 'Country B' entry is `similarity`, which should be a float between 0 and 1. Other properties may also be passed in without frontend errors for later integration.

See `iclab_new_data_format.json` for an example of a data file that can be used to populate the visualizations.
