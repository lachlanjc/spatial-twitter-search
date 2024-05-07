"use client";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MyTweet } from "@/app/tweet";

import {
  Container,
  Flex,
  Grid,
  Select,
  Spinner,
  TextField,
} from "@radix-ui/themes";

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

// function positionItems(items: Array<Result>) {
//   const width = window.innerWidth * 1.75;
//   const height = window.innerHeight * 1.5;
//   const nodes = items.map((item) => ({
//     id: item.id,
//     type: "tweet",
//     data: {
//       tweet: item.tweet,
//       // metadata: item.metadata,
//     },
//     position: {
//       x: item.fitting[0] * width,
//       y: item.fitting[1] * height,
//     },
//   }));
//   // console.log(nodes);
//   return nodes;
// }

function searchTweets(
  params: URLSearchParams,
  setNodes: (typeof useNodesState)[1],
  setIsLoading: Dispatch<SetStateAction<boolean>>,
) {
  fetch(`/api/search?${params.toString()}`)
    .then((res) => res.json())
    .then((data) => setNodes(data))
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
  const [nodes, setNodes] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const searchFormWith = useCallback(
    (field: keyof typeof FORM_STATE, newValue: string) => {
      console.log("Updating form state", field, newValue);
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
          router.replace(`/columns?${params.toString()}`);
        }
      });
    },
    [setFormState, setIsLoading, setNodes],
  );

  // Read formState from URL params
  useEffect(() => {
    if (searchParams) {
      const q = searchParams.get("q") || "";
      const kind = searchParams.get("kind") || FORM_STATE.kind;
      const link = searchParams.get("link") || FORM_STATE.link;
      const media = searchParams.get("media") || FORM_STATE.media;
      const interaction =
        searchParams.get("interaction") || FORM_STATE.interaction;
      console.log({ q, kind, link, media, interaction });
      setFormState({ q, interaction, media, kind, link });
      // TODO: Sanitize input
      if (q.trim().length > 0) {
        // setIsLoading(true);
        startTransition(() => {
          // const searchInput = document.getElementById("q");
          // if (searchInput) {
          //   (searchInput as HTMLInputElement).value = q;
          // }
          searchTweets(searchParams, setNodes, setIsLoading);
        });
      }
    }
  }, []);

  return (
    <>
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
            id="q"
            onChange={(e) =>
              setFormState((val) => ({ ...val, q: e.currentTarget.value }))
            }
            value={formState.q}
            onBlur={(e) => {
              searchFormWith("q", e.currentTarget.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            autoFocus
            // className="react-flow__controls search"
            size="3"
            style={{ width: "100%", zIndex: 5, position: "relative" }}
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
      <Grid
        px="5"
        // gap="4"
        style={{
          gap: "1rem 0.5rem",
          gridTemplateColumns: "repeat(auto-fill,minmax(550px,1fr))",
          gridTemplateRows: "masonry",
        }}
      >
        {nodes.map((node) => (
          <MyTweet key={node.id} tweet={node.tweet} />
        ))}
      </Grid>
    </>
  );
}
