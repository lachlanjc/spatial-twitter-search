# Twitter Spatial Semantic Search

I’ve combined my 1) desire to re-surface content from my Twitter feed 2) embeddings & semantic search and 3) my love of infinite canvas UIs:

https://github.com/lachlanjc/spatial-twitter-search/assets/5074763/f7021482-7983-439e-bd9a-cd9a1b4d942f

It’s an OpenAI embeddings-powered search tool for my Twitter likes & bookmarks, with advanced filtering, on an infinite canvas with draggable results.

This codebase is rather messy, but I [documented the process]https://edu.lachlanjc.com/2024-05-07_shm_spatial_semantic_twitter_search) of building the project with more screenshots on my blog. Run free with it!

## Running it yourself

1. Clone repo
2. `bun i`

Gathering your data is the most hacky process ever:

1. Create an empty file at `lib/tasks/likes-urls.txt`
2. Open Twitter, open the network tab > XHR in devtools, go to your profile’s likes page, scroll down a bunch (<kbd>Cmd-down</kbd> repeatedly). Right click, `Copy all URLs`, paste them into the text file, filter for the ones matching `Likes?`
3. Create a file at `lib/tasks/fetch-options.js`
4. On your bookmarks page, right click the `Bookmarks?` request in your devtools, `Copy as fetch (Node.js)`, then paste all those headers into the `fetch-options` file, like this:

   ```js
   export default const fetchOptions = {
     headers: {
       accept: "*/*",
       "accept-language": "en-US,en;q=0.9",
       authorization: "Bearer …"
   ```

5. In `.env`, set your `OPENAI_API_KEY` for embeddings
6. Install [ChromaDB](https://trychroma.com), in another terminal, `chroma run` (you’ll need to keep this running)
7. If you’re using [Zed](https://zed.dev), spawn the task for download, then for embedding. Otherwise, `bun run lib/tasks/download.js` then `bun run lib/tasks/embed.js`
8. `bun dev`

---

MIT License. The tweet data in `lib/db` is not mine.
