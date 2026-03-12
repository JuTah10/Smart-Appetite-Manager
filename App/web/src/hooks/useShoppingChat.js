import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { AGENTS } from "@/api/agents";
import {
  responseToChatText,
  extractRecipeData,
  extractShopperMapData,
  extractRoutePlanData,
} from "@/lib/parseResponse";
import {
  appendExecutionLifecycleStep,
  applyArtifactUpdateToTimeline,
  applyStatusUpdateToTimeline,
  createExecutionTimelineTracker,
  getExecutionTimelineSnapshot,
} from "@/lib/executionTimeline";

/**
 * Keywords that indicate the user wants route planning / optimization.
 * Everything else is routed to the ShopperAgent for deal finding.
 */
const ROUTE_KEYWORDS =
  /\b(plan|route|optimi[sz]e|trip|fewest|stops|optimal|best route|shopping route|minimize|least stores)\b/i;

function detectAgent(prompt) {
  return ROUTE_KEYWORDS.test(prompt)
    ? AGENTS.ROUTE_PLANNER
    : AGENTS.SHOPPER;
}

/**
 * Extract unique item names from shopper map data so we can auto-send
 * them to the route planner.
 */
function extractItemsFromMapData(mapData) {
  const items = new Set();
  for (const store of mapData?.stores || []) {
    for (const item of store.items || []) {
      if (item.name) items.add(item.name);
    }
  }
  return [...items];
}

/**
 * Unified shopping chat hook with smart agent routing and auto route planning.
 *
 * - Detects whether a prompt is for deals or route planning using keywords
 * - After the ShopperAgent returns deals, automatically triggers the
 *   RoutePlannerAgent with the same items
 * - Single message list shared across both tabs
 */
export function useShoppingChat(client, options = {}) {
  const {
    welcomeText = "Smart Shopping Assistant ready! Ask me to find deals or plan your shopping route.",
    idPrefix = "shopping",
    onComplete,
  } = options;

  const [messages, setMessages] = useState([
    {
      id: `${idPrefix}-welcome`,
      role: "assistant",
      text: welcomeText,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTimeline, setActiveTimeline] = useState([]);
  const trackerRef = useRef(null);
  const msgIdRef = useRef(1);

  /**
   * Internal: send a prompt to a specific agent and append the response
   * to the shared message list. Returns the parsed message data.
   */
  const sendToAgent = useCallback(
    async (prompt, agentName, { isAutoFollowUp = false } = {}) => {
      const tracker = createExecutionTimelineTracker();
      trackerRef.current = tracker;

      const agentLabel =
        agentName === AGENTS.ROUTE_PLANNER ? "Route Planner" : "Grocery Scout";

      appendExecutionLifecycleStep(tracker, {
        status: "info",
        title: isAutoFollowUp
          ? `Auto-routing to ${agentLabel}...`
          : "Task submitted",
      });
      setActiveTimeline(getExecutionTimelineSnapshot(tracker));

      try {
        const result = await client.send(prompt, agentName, {
          onStatus: (statusText, payload) => {
            const changed = applyStatusUpdateToTimeline(
              tracker,
              statusText,
              payload
            );
            if (changed) {
              setActiveTimeline(getExecutionTimelineSnapshot(tracker));
            }
          },
          onArtifact: (payload) => {
            const changed = applyArtifactUpdateToTimeline(tracker, payload);
            if (changed) {
              setActiveTimeline(getExecutionTimelineSnapshot(tracker));
            }
          },
        });

        appendExecutionLifecycleStep(tracker, {
          status: "completed",
          title: `${agentLabel} responded`,
        });
        const timeline = getExecutionTimelineSnapshot(tracker);

        const rawText = responseToChatText(result);
        const { recipes: recipeData, cleanText: afterRecipe } =
          extractRecipeData(rawText);
        const { mapData: shopperMapData, cleanText: afterMap } =
          extractShopperMapData(afterRecipe);
        const { routeData: routePlanData, cleanText } =
          extractRoutePlanData(afterMap);

        const msgData = {
          id: `${idPrefix}-assistant-${msgIdRef.current++}`,
          role: "assistant",
          text: cleanText,
          rawText,
          timeline,
          recipeData,
          shopperMapData,
          routePlanData,
          agentName,
        };

        setMessages((prev) => [...prev, msgData]);
        return msgData;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        appendExecutionLifecycleStep(tracker, {
          status: "error",
          title: "Request failed",
          detail: message,
        });
        const timeline = getExecutionTimelineSnapshot(tracker);

        setMessages((prev) => [
          ...prev,
          {
            id: `${idPrefix}-error-${msgIdRef.current++}`,
            role: "assistant",
            text: `Request failed: ${message}`,
            timeline,
            agentName,
          },
        ]);
        toast.error(`${agentLabel} failed`, { description: message });
        return null;
      }
    },
    [client, idPrefix]
  );

  /**
   * Primary send function — detects agent, sends, and auto-follows-up.
   */
  const send = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || sending) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: `${idPrefix}-user-${msgIdRef.current++}`,
        role: "user",
        text: prompt,
      },
    ]);
    setInput("");
    setSending(true);

    try {
      const agent = detectAgent(prompt);
      const response = await sendToAgent(prompt, agent);

      // Auto-follow-up: if ShopperAgent returned deals, auto-trigger Route Planner
      if (
        response &&
        agent === AGENTS.SHOPPER &&
        response.shopperMapData &&
        Array.isArray(response.shopperMapData.stores) &&
        response.shopperMapData.stores.length > 0
      ) {
        const items = extractItemsFromMapData(response.shopperMapData);
        if (items.length > 0) {
          // Add a system divider message
          setMessages((prev) => [
            ...prev,
            {
              id: `${idPrefix}-auto-${msgIdRef.current++}`,
              role: "system",
              text: `Automatically optimizing your route for ${items.length} items...`,
            },
          ]);

          const routePrompt = `Plan the optimal shopping route for these items: ${items.join(", ")}`;
          await sendToAgent(routePrompt, AGENTS.ROUTE_PLANNER, {
            isAutoFollowUp: true,
          });
        }
      }

      onComplete?.();
    } finally {
      trackerRef.current = null;
      setSending(false);
      setActiveTimeline([]);
    }
  }, [client, input, sending, idPrefix, onComplete, sendToAgent]);

  return {
    messages,
    input,
    setInput,
    sending,
    activeTimeline,
    send,
  };
}
