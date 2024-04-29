import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";

const tweets = await Bun.file("lib/db/tweets-processed.json")
  .text()
  .then((text) => JSON.parse(text));

const client = new ChromaClient();

// special class which will be passed to client and automatically create embeddings
const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
});

const COLLECTION_NAME = "tweet-canvas";

// delete collections to remove stale records and rebuild with up to date data.
await client.deleteCollection({ name: COLLECTION_NAME });

// create a collection
// note that we pass embedder that will automtically create embeddings
// with OpenAI Embeddings API
const collection = await client.createCollection({
  name: COLLECTION_NAME,
  embeddingFunction: embedder,
});

const documents = tweets.map((tweet) => {
  let content = tweet.text;
  tweet.entities
    .filter((entity) => entity.type === "url")
    .forEach((entity) => {
      content = content.replace(entity.url, entity.expanded_url);
    });
  tweet.mediaDetails?.forEach((media) => {
    if (media.ext_alt_text) {
      content = content.replace(media.url, media.ext_alt_text);
      // TODO: add tag names, mentions
    }
  });
  return `${tweet.user.name} (${tweet.user.screen_name}): ${content}`;
});

console.log(documents);

// feed data into new collection
// note that we don't pass embeddings, however they will be created behind the scenes
await collection.add({
  ids: tweets.map((i) => i.id_str),
  metadatas: tweets.map(({ bookmarked, favorited, retweeted }) => ({
    bookmarked,
    favorited,
    retweeted,
  })),
  documents,
});

console.log(
  `Saved ${tweets.length} tweets to ChromaDB collection ${COLLECTION_NAME}`
);
