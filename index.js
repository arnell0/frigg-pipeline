const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { TWITTER_API_BEARER_TOKEN } = process.env;

const { TwitterApi } = require('twitter-api-v2');
const { FriggTweets, FriggQueries } = require('./api/supabase')
const {spawn} = require('child_process');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function fetchTweets(client, search) {
    try {
        const query = `${search} lang:sv -is:retweet -is:reply`;

        const jsTweets = await client.v2.search(query,{
            'max_results': 100,
            'sort_order': 'relevancy',
            'tweet.fields': 'public_metrics,created_at',
        });
        // params: [query,start_time,end_time,since_id,until_id,max_results,next_token,pagination_token,sort_order,expansions,tweet.fields,media.fields,poll.fields,place.fields,user.fields]

        const tweets = {...jsTweets}._realData.data.filter(tweet => tweet.public_metrics.like_count > 0);
        return tweets;
    } catch (error) {
        console.log(error)
        return []
    } 
}

async function getSentiment(arr) {
    try {
        var data
        const python = spawn('python3', ['/root/projects/frigg-pipeline/sentiment/vader.py', ...arr]);
        python.stdout.on('data', (_data) => {
            var d = JSON.parse(_data.toString().replaceAll('(','[').replaceAll(')',']').replaceAll('\'','"')) 
            data = d
        });
        python.on('close', async () => {})
        
        return sleep(10000).then(() => data)
    } catch (error) {
        console.log(error);
        const data = arr.map(item => ({ neg: 0, neu: 0, pos: 0, compound: 0 }))
        return data
    }
}





async function main() {
    const client = new TwitterApi(TWITTER_API_BEARER_TOKEN);

    console.log('Starting pipeline --------------------------------------------------')
    console.log('Fetching queries...')
    const data = await FriggQueries.Read();

    const newTweets = []

    for (i = 0; i < data.length; i++) {
        try {
            const item = data[i];
            console.log(`Fetching tweets for ${item.query}`)

            let search = ''
            item.query.map((q, i) => search += `${i > 0 ? ' OR ': ''}"${q}"`)
            const tweets = await fetchTweets(client, search);
            console.log(`Found ${tweets.length} tweets`)
            const texts = tweets.map(tweet => tweet.text.split('\n').join(' '));
            const sentiment = await getSentiment(texts)
            console.log(`Sentiment calculated`)
            
            /* Tweet structure
            {
                "author_id": "379070787",
                "public_metrics": {
                    "retweet_count": 8,
                    "reply_count": 6,
                    "like_count": 58,
                    "quote_count": 0
                },
                "text": "Per Bolund i dag: \"Utan miljöpartiet blir det ingen miljöpolitik. Jag vet det, Magdalena Andersson vet det, ni vet det.\"",
                "created_at": "2022-05-28T15:22:17.000Z",
                "id": "1530570160293265411"
            } 
            */
            
            const _newTweets = tweets.map((tweet, i) => {
                const _tweet = {...tweet}
                _tweet.text = _tweet.text.split('\n').join(' ')

                const compound_weighted  = () => {
                    try {
                        return (sentiment[i].compound * _tweet.public_metrics.retweet_count * (_tweet.public_metrics.like_count / 10)).toPrecision(3)
                    } catch (error) {
                        console.log(error)
                        return 0
                    }
                }
                
                const _tweet_ = {
                    tweet: _tweet,
                    sentiment: sentiment[i],
                    query: item.query,
                    compound: sentiment[i].compound,
                    compound_weighted: compound_weighted(),
                }
                return _tweet_
            })
            newTweets.push(..._newTweets)
            console.log(`${_newTweets.length} tweets added to newTweets`)
        } catch (error) {
            console.log(error)
        }
    console.log(`Query ${i}/${data.length} done ---------------------------------------------------`)
    console.log('\n\n')
  }


  await FriggTweets.Create(newTweets)
  console.log('Posting to Supabase...')
  console.log('Done!')
}

main()