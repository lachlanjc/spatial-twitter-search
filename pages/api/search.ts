// Why is this under Pages Router? That's a great question!
// Strangely, Next.js is not able ro run `chromadb` in a Route Handler under App Router.
// It throws the following error:
// /node_modules/onnxruntime-node/bin/napi-v3/darwin/arm64/onnxruntime_binding.node
// Module parse failed: Unexpected character '�' (1:0)

// Running it under Pages Router works fine though ¯\_(ツ)_/¯

import type { NextApiRequest, NextApiResponse } from "next";
import { ChromaClient, IncludeEnum, OpenAIEmbeddingFunction } from "chromadb";
import { UMAP } from "umap-js";
import db from "@/lib/db/tweets-processed.json";

function normalize(fitting: number[][]) {
  // find max and min in the array
  let max = [0, 0];
  let min = [0, 0];
  for (let i = 0; i < fitting.length; i++) {
    for (let j = 0; j < 2; j++) {
      max[j] = Math.max(max[j], fitting[i][j]);
      min[j] = Math.min(min[j], fitting[i][j]);
    }
  }

  // normalize
  for (let i = 0; i < fitting.length; i++) {
    for (let j = 0; j < 2; j++) {
      fitting[i][j] = (fitting[i][j] - min[j]) / (max[j] - min[j]);
    }
  }

  return fitting;
}

export async function queryTweets(query: string) {
  const client = new ChromaClient();
  const COLLECTION_NAME = "tweet-canvas";

  // initialize embedder to create embeddings from user query
  const embedder = new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY ?? "",
  });

  const collection = await client.getCollection({
    name: COLLECTION_NAME,
    embeddingFunction: embedder,
  });

  // query items in ChromaDB with give query phrase
  const items = await collection.query({
    nResults: 12,
    queryTexts: query,
    include: [IncludeEnum.Embeddings, IncludeEnum.Metadatas],
  });

  // const items = {
  //   ids: [[]],
  //   embeddings: [],
  //   metadatas: [],
  // };

  // :   Array<{
  //   id: string;
  //   tweet: db[number];
  //   fitting: [number, number];
  // }>
  const records = (items.ids[0] ?? [])
    .map((id, i) => {
      const metadata = items.metadatas[0][i];
      const tweet = db.find((tweet) => tweet.id_str === id);
      if (!tweet) return null;
      return {
        id,
        fitting: [0, 0],
        metadata,
        tweet,
      };
    })
    .filter(Boolean);

  const umap = new UMAP({
    nNeighbors: 2,
    minDist: 0.01,
    spread: 5,
    nComponents: 2, // dimensions
  });
  let fittings = umap.fit(items.embeddings?.[0] ?? []);
  fittings = normalize(fittings); // normalize to 0-1

  records.forEach((_, i) => {
    records[i]!.fitting = fittings[i];
  });

  return records;
}

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  const query = req.query.q;

  // throw an error if query param is not defined
  if (!query) {
    return res
      .status(403)
      .json({ error: "Please provide search query phrase" });
  }

  // don'send empty reponse if query is less than 2 chars
  if (query.length < 2) {
    return res
      .status(403)
      .json({ error: "Please provide longer search query phrase" });
  }

  const results = await queryTweets(query.toString());

  return res.json(results);
}
