import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { responseToChatText, extractRecipeData, extractShopperMapData, extractRoutePlanData } from "@/lib/parseResponse";
import { normalizeAgentRecipeList } from "@/lib/mealdb";
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
    welcomeText = "SAM agent ready. Ask me anything.",
    idPrefix = "chat",
    errorLabel = "SAM agent failed",
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
  const msgIdRef = useRef(Date.now());

  const send = useCallback(async (overridePrompt, messageMetadata) => {
    const prompt = (overridePrompt ?? input).trim();
    if (!prompt || sending) return;
    if (!overridePrompt) setInput("");

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
        ...messageMetadata,
      },
    ]);
    setSending(true);

    try {
      const wirePrompt = prompt;
      const statusTexts = [];
      const result = await client.send(wirePrompt, agentName, {
        onStatus: (statusText, payload) => {
          if (statusText) statusTexts.push(statusText);
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
      console.log("[RecipeDebug] rawText length:", rawText.length);
      console.log("[RecipeDebug] rawText preview:", rawText.slice(0, 200));
      console.log("[RecipeDebug] contains recipe_data block:", /```recipe_data/i.test(rawText));

      const { recipes: explicitRecipeData, cleanText: afterRecipe } = extractRecipeData(rawText);
      console.log("[RecipeDebug] extractRecipeData result:", explicitRecipeData?.length ?? "null");

      const { mapData: shopperMapData, cleanText: afterMap } = extractShopperMapData(afterRecipe);
      const { routeData: routePlanData, cleanText } = extractRoutePlanData(afterMap);

      // Auto-detect recipe data: use explicit recipe_data block first,
      // then fall back to parsing the full response for any JSON recipe arrays,
      // then fall back to scanning streaming status updates (helper agent responses
      // may contain recipe_data blocks that the routing agent rewrote)
      let recipeData = explicitRecipeData;
      if (!recipeData || !recipeData.length) {
        console.log("[RecipeDebug] Tier 1 (explicit) empty, trying normalizeAgentRecipeList on rawText");
        const detected = normalizeAgentRecipeList(rawText);
        console.log("[RecipeDebug] Tier 2 (normalize rawText) result:", detected.length);
        if (detected.length > 0) {
          recipeData = detected;
        }
      }
      if (!recipeData || !recipeData.length) {
        console.log("[RecipeDebug] Tier 2 empty, trying statusTexts. Count:", statusTexts.length);
        const combined = statusTexts.join("\n");
        const { recipes: statusRecipes } = extractRecipeData(combined);
        console.log("[RecipeDebug] Tier 3a (extractRecipeData on statusTexts):", statusRecipes?.length ?? "null");
        if (statusRecipes?.length) {
          recipeData = statusRecipes;
        } else {
          const detected = normalizeAgentRecipeList(combined);
          console.log("[RecipeDebug] Tier 3b (normalize statusTexts):", detected.length);
          if (detected.length > 0) {
            recipeData = detected;
          }
        }
      }
      console.log("[RecipeDebug] Final recipeData count:", recipeData?.length ?? "null");

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
          ...messageMetadata,
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
