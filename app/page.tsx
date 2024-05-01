"use client";
import {
  type Dispatch,
  type SetStateAction,
  type CSSProperties,
  startTransition,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MyTweet } from "@/app/tweet";

import {
  Text,
  Flex,
  Grid,
  Select,
  Spinner,
  TextField,
  Container,
  Button,
} from "@radix-ui/themes";

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
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

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
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  const width = window.innerWidth * 2;
  const height = window.innerHeight * 1.5;
  const nodes = items.map((item) => ({
    id: item.id,
    type: "tweet",
    data: {
      tweet: item.tweet,
      // metadata: item.metadata,
    },
    position: {
      x: item.fitting[0] * width,
      y: item.fitting[1] * height,
    },
  }));
  console.log(nodes);
  return nodes;
}

function searchTweets(
  params: URLSearchParams,
  setNodes: (typeof useNodesState)[1],
  setIsLoading: Dispatch<SetStateAction<boolean>>,
) {
  fetch(`/api/search?${params.toString()}`)
    .then((res) => res.json())
    .then((data) => setNodes(positionItems(data)))
    .then(() => setIsLoading(false));
}

const FORM_STATE = {
  q: "",
  kind: "any",
  link: "any",
  media: "any",
  interaction: "any",
};

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formState, setFormState] = useState(FORM_STATE);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const searchFormWith = useCallback(
    (field: keyof typeof FORM_STATE, newValue: string) => {
      setIsLoading(true);
      setFormState((obj) => ({ ...obj, [field]: newValue }));
      startTransition(() => {
        const params = new URLSearchParams();
        const { q, interaction, kind, media, link } = {
          ...formState,
          // @ts-expect-error we know it's a field of FORM_STATE
          [field]: newValue,
        };
        console.log("FORM STATE", formState);
        params.set("q", q);
        params.set("kind", kind);
        params.set("link", link);
        params.set("media", media);
        params.set("interaction", interaction);

        if (q.trim().length === 0) {
          // router.replace("/");
          setNodes([]);
        } else {
          searchTweets(params, setNodes, setIsLoading);
          router.replace(`/?${params.toString()}`);
        }
      });
    },
    [setFormState, setIsLoading, setNodes],
  );

  // Read formState from URL params
  useEffect(() => {
    if (searchParams) {
      setIsLoading(true);
      const q = searchParams.get("q") || "";
      const kind = searchParams.get("kind") || FORM_STATE.kind;
      const link = searchParams.get("link") || FORM_STATE.link;
      const media = searchParams.get("media") || FORM_STATE.media;
      const interaction =
        searchParams.get("interaction") || FORM_STATE.interaction;
      setFormState({ q, interaction, media, kind, link });
      // TODO: Sanitize input
      startTransition(() => {
        searchTweets(searchParams, setNodes, setIsLoading);
      });
    }
  }, []);

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
        <Background variant={BackgroundVariant.Dots} gap={55} size={2} />
        <Panel position="top-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            style={{
              paddingBlock: 24,
              position: "sticky",
              top: 0,
              zIndex: 4,
            }}
          >
            <div className="blur">
              <div
                className="blur-layer"
                style={{ "--index": 1 } as CSSProperties}
              />
              <div
                className="blur-layer"
                style={{ "--index": 2 } as CSSProperties}
              />
              <div
                className="blur-layer"
                style={{ "--index": 3 } as CSSProperties}
              />
              <div
                className="blur-layer"
                style={{ "--index": 4 } as CSSProperties}
              />
            </div>
            <Container maxWidth="680px">
              <TextField.Root
                placeholder="Search tweets…"
                variant="classic"
                type="search"
                onChange={(e) => {
                  setFormState((val) => ({ ...val, q: e.target.value }));
                }}
                value={formState.q}
                onBlur={(e) => {
                  searchFormWith("q", e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                autoFocus
                // className="react-flow__controls search"
                size="3"
                style={{ width: "100%", position: "relative", zIndex: 5 }}
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon height="16" width="16" />
                </TextField.Slot>
                <TextField.Slot>
                  {(isPending || isLoading) && <Spinner />}
                </TextField.Slot>
              </TextField.Root>
              <Grid columns="4" gap="4" mt="4">
                <Select.Root
                  name="kind"
                  defaultValue="any"
                  onValueChange={(val) => searchFormWith("kind", val)}
                >
                  <Select.Trigger variant="classic" radius="full" />
                  <Select.Content variant="soft" position="popper">
                    <Select.Item value="any">Any type</Select.Item>
                    <Select.Item value="standalone">Standalone</Select.Item>
                    <Select.Item value="quote">Quotes</Select.Item>
                    <Select.Item value="reply">Replies</Select.Item>
                  </Select.Content>
                </Select.Root>
                <Select.Root
                  name="link"
                  defaultValue="any"
                  onValueChange={(val) => searchFormWith("link", val)}
                >
                  <Select.Trigger variant="classic" radius="full" />
                  <Select.Content variant="soft" position="popper">
                    <Select.Item value="any">Any links</Select.Item>
                    <Select.Item value="mention">Has mention</Select.Item>
                    <Select.Item value="url">Has URL</Select.Item>
                    <Select.Item value="hashtag">Has hashtag</Select.Item>
                  </Select.Content>
                </Select.Root>
                <Select.Root
                  name="media"
                  defaultValue="any"
                  onValueChange={(val) => searchFormWith("media", val)}
                >
                  <Select.Trigger variant="classic" radius="full" />
                  <Select.Content variant="soft" position="popper">
                    <Select.Item value="any">Any media</Select.Item>
                    <Select.Item value="photo">Has photo</Select.Item>
                    <Select.Item value="gif">Has GIF</Select.Item>
                    <Select.Item value="video">Has video</Select.Item>
                  </Select.Content>
                </Select.Root>
                <Select.Root
                  defaultValue="any"
                  onValueChange={(val) => searchFormWith("interaction", val)}
                >
                  <Select.Trigger variant="classic" radius="full" />
                  <Select.Content variant="soft" position="popper">
                    <Select.Item value="any">Any interaction</Select.Item>
                    <Select.Item value="favorited">Liked</Select.Item>
                    <Select.Item value="bookmarked">Bookmarked</Select.Item>
                    {/* <Select.Item value="retweeted">Retweeted</Select.Item> */}
                  </Select.Content>
                </Select.Root>
              </Grid>
            </Container>
          </form>
        </Panel>
        <Panel position="bottom-center">
          {nodes.length === 0 &&
            !isLoading &&
            (formState.q.trim().length > 0 ? (
              <Text size="3" color="gray" mb="4">
                No tweets found
              </Text>
            ) : (
              <Flex direction="column" align="center" gap="4" p="4">
                <Text size="3" color="gray" weight="bold">
                  Suggested searches
                </Text>
                <Flex gap="4">
                  {["AI", "CSS", "spatial computing", "typography"].map(
                    (topic) => (
                      <Button
                        variant="soft"
                        radius="full"
                        onClick={() => searchFormWith("q", topic)}
                      >
                        {topic}
                      </Button>
                    ),
                  )}
                </Flex>
              </Flex>
            ))}
        </Panel>
      </ReactFlow>
    </div>
  );
}
