require('dotenv').config();
const {API_KEY, API_SECRET, API_BEARER_TOKEN, CLIENT_KEY, CLIENT_SECRET} = process.env;

const { TwitterApi } = require('twitter-api-v2');

async function main() {
    const client = new TwitterApi(API_BEARER_TOKEN);
    const jsTweets = await client.v2.search('magdalena andersson lang:sv', { 'media.fields': 'url' });

    // Consume every possible tweet of jsTweets (until rate limit is hit)
    for await (const tweet of jsTweets) {
        console.log(tweet);
    }
}
main()