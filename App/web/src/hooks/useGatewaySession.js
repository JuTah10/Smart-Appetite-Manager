import { useEffect, useCallback } from "react";
import { makeSessionId } from "@/lib/session";

/**
 * Initialize and persist a gateway session from localStorage.
 *
 * @param {import("@/api/gateway").GatewayClient} client
 * @param {object} storageKeys - { gatewayUrl, sessionId, agentName }
 * @param {string} defaultAgentName
 */
export function useGatewaySession(client, storageKeys, defaultAgentName) {
  useEffect(() => {
    const savedGatewayUrl =
      localStorage.getItem(storageKeys.gatewayUrl) || "http://localhost:8000";
    const savedSessionId =
      localStorage.getItem(storageKeys.sessionId) || makeSessionId();

    client.setGatewayUrl(savedGatewayUrl);
    client.setSessionId(savedSessionId);
    localStorage.setItem(storageKeys.gatewayUrl, savedGatewayUrl);
    localStorage.setItem(storageKeys.sessionId, savedSessionId);
    if (storageKeys.agentName) {
      localStorage.setItem(storageKeys.agentName, defaultAgentName);
    }
  }, [client, storageKeys, defaultAgentName]);

  const persistSession = useCallback(() => {
    const currentSessionId = client.getSessionId();
    localStorage.setItem(storageKeys.sessionId, currentSessionId);
    if (storageKeys.agentName) {
      localStorage.setItem(storageKeys.agentName, defaultAgentName);
    }
  }, [client, storageKeys, defaultAgentName]);

  return { persistSession };
}
