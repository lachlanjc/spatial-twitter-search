import { enrichTweet } from "react-tweet";
import options from "./fetch-options";

const flags =
  "%2C%22includePromotedContent%22%3Afalse%7D&features=%7B%22graphql_timeline_v2_bookmark_timeline%22%3Atrue%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Afalse%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22creator_subscriptions_quote_tweet_preview_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_media_interstitial_enabled%22%3Atrue%2C%22rweb_video_timestamps_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D";

// export async function GET() {
// const data = await fetch(
Promise.all([
  fetch(
    `https://twitter.com/i/api/graphql/yzqS_xq0glDD7YZJ2YDaiA/Bookmarks?variables=%7B%22count%22%3A100${flags}`,
    options
  ).then((res) => res.json()),
  fetch(
    `https://twitter.com/i/api/graphql/yzqS_xq0glDD7YZJ2YDaiA/Bookmarks?variables=%7B%22count%22%3A100%2C%22cursor%22%3A%22HBb02bC4sffL0y8AAA%3D%3D%22${flags}`,
    options
  ).then((res) => res.json()),
])
  .then((arr) =>
    arr
      .map((res) =>
        res.data.bookmark_timeline_v2.timeline.instructions[0].entries.filter(
          (entry) => entry.entryId.startsWith("tweet")
        )
      )
      .flat()
      .map((tweet) => tweet.content.itemContent.tweet_results.result)
      .map((tweet) =>
        tweet.__typename === "TweetWithVisibilityResults" ? tweet.tweet : tweet
      )
  )
  /*
Bun.file("tweets-raw.json")
  .text()
  .then((text) => JSON.parse(text))
  */
  .then((tweets) => {
    // console.log(tweets.length, tweets[0]);
    const results = tweets.map((raw) => {
      let tweet = raw.legacy ?? {};
      tweet.__typename = "Tweet";
      tweet.news_action_type = "conversation";
      tweet.edit_control = raw.edit_control;
      tweet.isEdited = false;
      tweet.isStaleEdit = false;
      tweet.text = tweet.full_text;
      tweet.conversation_count = tweet.quote_count + tweet.reply_count;

      const user = raw.core.user_results.result;
      tweet.user = {
        id_str: user.id,
        name: user.legacy.name,
        profile_image_url_https: user.legacy.profile_image_url_https,
        profile_image_shape: user.profile_image_shape,
        screen_name: user.legacy.screen_name,
        verified: user.legacy.verified,
        is_blue_verified: user.is_blue_verified,
      };

      tweet.mediaDetails = tweet.entities?.media;

      tweet = enrichTweet(tweet);
      delete tweet.extended_entities;

      return tweet;
    });
    return results;
  })
  .then((results) => {
    console.log(`Saved ${results.length} tweets`);
    Bun.write(
      "lib/db/tweets-processed-readable.json",
      JSON.stringify(results, null, 2)
    );
    Bun.write("lib/db/tweets-processed.json", JSON.stringify(results));
  });
