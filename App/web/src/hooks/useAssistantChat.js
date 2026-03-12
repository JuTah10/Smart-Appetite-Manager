import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { responseToChatText, extractRecipeData, extractShopperMapData, extractRoutePlanData } from "@/lib/parseResponse";
import {
  appendExecutionLifecycleStep,
  applyArtifactUpdateToTimeline,
  applyStatusUpdateToTimeline,
  createExecutionTimelineTracker,
  getExecutionTimelineSnapshot,
} from "@/lib/executionTimeline";

/**
 * Self-contained chat state and send logic for the assistant panel.
 *
 * @param {import("@/api/gateway").GatewayClient} client - Gateway client
 * @param {string} agentName - Agent to send prompts to
 * @param {object} options
 * @param {string} options.welcomeText - Initial assistant message
 * @param {string} options.idPrefix - Prefix for message IDs
 * @param {string} options.errorLabel - Label for toast errors
 * @param {() => void} [options.onComplete] - Called after successful send
 */
export function useAssistantChat(client, agentName, options = {}) {
  const {
    welcomeText = "Assistant ready. Ask me anything.",
    idPrefix = "chat",
    errorLabel = "Chat failed",
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

  const send = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || sending) return;

    const tracker = createExecutionTimelineTracker();
    trackerRef.current = tracker;
    appendExecutionLifecycleStep(tracker, {
      status: "info",
      title: "Task submitted",
    });
    setActiveTimeline(getExecutionTimelineSnapshot(tracker));

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
      const result = await client.send(prompt, agentName, {
        onStatus: (statusText, payload) => {
          const changed = applyStatusUpdateToTimeline(tracker, statusText, payload);
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
        title: "Final response received",
      });
      const timeline = getExecutionTimelineSnapshot(tracker);

      const rawText = responseToChatText(result);
      const { recipes: recipeData, cleanText: afterRecipe } = extractRecipeData(rawText);
      const { mapData: shopperMapData, cleanText: afterMap } = extractShopperMapData(afterRecipe);
      const { routeData: routePlanData, cleanText } = extractRoutePlanData(afterMap);

      setMessages((prev) => [
        ...prev,
        {
          id: `${idPrefix}-assistant-${msgIdRef.current++}`,
          role: "assistant",
          text: cleanText,
          rawText,
          timeline,
          recipeData,
          shopperMapData,
          routePlanData,
        },
      ]);
      setActiveTimeline([]);
      onComplete?.();
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
        },
      ]);
      setActiveTimeline([]);
      toast.error(errorLabel, { description: message });
    } finally {
      trackerRef.current = null;
      setSending(false);
    }
  }, [client, agentName, input, sending, idPrefix, errorLabel, onComplete]);

  return {
    messages,
    input,
    setInput,
    sending,
    activeTimeline,
    send,
  };
}
