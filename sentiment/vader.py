from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import sys

arr = []

# loop through sys.argv but skip the first item
for line in sys.argv[1:]:
    analyzer = SentimentIntensityAnalyzer()
    vs = analyzer.polarity_scores(line)
    del vs['debug']
    arr.append(vs)

print(arr)