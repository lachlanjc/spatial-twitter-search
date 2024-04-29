"use client";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MyTweet } from "./tweet";

import ReactFlow, {
  Controls,
  Background,
  Panel,
  // Position,
  // NodeResizer,
  // NodeToolbar,
  useNodesState,
  BackgroundVariant,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import { EnrichedTweet } from "react-tweet";

interface Result {
  id: string;
  fitting: [number, number];
  metadata: {
    bookmarked: boolean;
    favorited: boolean;
    retweeted: boolean;
  };
  tweet: EnrichedTweet;
}

function TweetNode({
  data: { tweet, metadata },
}: {
  data: Pick<Result, "tweet" | "metadata">;
}) {
  return <MyTweet tweet={tweet} />;
}

const nodeTypes = { tweet: TweetNode };

function positionItems(items: Array<Result>) {
  const width = window.innerWidth * 1.5;
  const height = window.innerHeight * 1.5;
  const nodes = items.map((item) => ({
    id: item.id,
    type: "tweet",
    data: {
      tweet: item.tweet,
      metadata: item.metadata,
    },
    position: {
      x: item.fitting[0] * width,
      y: item.fitting[1] * height,
    },
  }));
  console.log(nodes);
  return nodes;
}

function searchTweets(q: string, setNodes: (typeof useNodesState)[1]) {
  fetch(`/api/search?q=${q}`)
    .then((res) => res.json())
    .then((data) => setNodes(positionItems(data)));
}

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams?.get("q");

  const [q, setQ] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  useEffect(() => {
    if (qParam) {
      setQ(qParam);
      searchTweets(qParam, setNodes);
    }
  }, [qParam]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        elevateNodesOnSelect
        nodesFocusable={false}
        nodesConnectable={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
      >
        <MiniMap />
        <Controls showInteractive={false} />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Panel position="top-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim().length === 0) {
                router.replace("/");
                setNodes([]);
              } else {
                router.replace("/?q=" + encodeURIComponent(q));
                searchTweets(q, setNodes);
              }
            }}
            // style={{
            //   position: "absolute",
            //   left: "50%",
            //   translate: "-50% -100%",
            // }}
          >
            <input
              type="search"
              placeholder="Search"
              onChange={(e) => setQ(e.currentTarget.value)}
              value={q}
              autoFocus
              className="react-flow__controls search"
            />
          </form>
        </Panel>
      </ReactFlow>
    </div>
  );
}
