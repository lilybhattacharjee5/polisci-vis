# Data

This directory contains cleaned ICLab data in a simple file format that can be parsed by the public demo frontend, and powers the demo's world map and force graphs.

File format:

```
{
 "USA->CAN": {
 	Overall_Similarity: [float],
 	... // can include other pair-specific attributes
 },
 "USA->UKR": {
 	Overall_Similarity: [float],
 	... // can include other pair-specific attributes
 },
 ...
}
```

Since edges are bidirectional, these edges don't need to be exhaustive. (That
is, if you have a "USA->CAN" pair, you do not need a "CAN->USA" pair).

Similarity scores (floats) should range from 0 to 100.

Note that Alpha-3 codes (rather than Alpha-2 or country names) are required.
