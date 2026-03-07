/**
 * React hooks for the Agent API layer.
 *
 * Provides easy-to-use hooks that manage loading/error state
 * and return structured data from agent responses.
 *
 * Usage:
 *   const { data, loading, error, execute } = useAgentQuery();
 *
 *   // In a handler or effect:
 *   execute(() => api.inventory.list());
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { GatewayClient } from "./gateway";
import { createAgentAPI } from "./agents";

/**
 * Hook to create and manage a GatewayClient + AgentAPI instance.
 *
 * @param {string} gatewayUrl - Gateway base URL
 * @returns {{ client: GatewayClient, api: ReturnType<createAgentAPI> }}
 */
export function useGateway(gatewayUrl = "http://localhost:8000") {
  const clientRef = useRef(null);

  if (!clientRef.current) {
    clientRef.current = new GatewayClient(gatewayUrl);
  }

  // Update URL if it changes
  clientRef.current.setGatewayUrl(gatewayUrl);

  const api = useMemo(() => createAgentAPI(clientRef.current), []);

  return { client: clientRef.current, api };
}

/**
 * Hook for executing agent queries with loading/error/data state.
 *
 * @returns {{ data, loading, error, text, execute, reset }}
 *
 * @example
 *   const { data, loading, error, execute } = useAgentQuery();
 *
 *   const handleListInventory = () => {
 *     execute(() => api.inventory.list());
 *   };
 *
 *   // data will contain the parsed structured data (JSON array, table rows, etc.)
 *   // text will contain the raw text response
 */
export function useAgentQuery() {
  const [state, setState] = useState({
    data: null,
    text: null,
    type: null, // "json" | "table" | "text"
    loading: false,
    error: null,
  });

  const execute = useCallback(async (queryFn, options = {}) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await queryFn();
      setState({
        data: result.data,
        text: result.text,
        type: result.type,
        loading: false,
        error: null,
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState((prev) => ({
        ...prev,
        loading: false,
        error,
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, text: null, type: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

/**
 * Hook for streaming agent responses with status updates.
 *
 * @returns {{ data, loading, error, status, execute, reset }}
 *
 * @example
 *   const { data, loading, status, execute } = useAgentStream();
 *
 *   const handleSearch = () => {
 *     execute((api) => api.recipes.suggestFromInventory({
 *       onStatus: (text) => console.log("Status:", text),
 *     }));
 *   };
 */
export function useAgentStream() {
  const [state, setState] = useState({
    data: null,
    text: null,
    type: null,
    loading: false,
    error: null,
    status: null,
  });

  const execute = useCallback(async (queryFn) => {
    setState((prev) => ({ ...prev, loading: true, error: null, status: null }));

    try {
      const result = await queryFn();
      setState({
        data: result.data,
        text: result.text,
        type: result.type,
        loading: false,
        error: null,
        status: "complete",
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState((prev) => ({
        ...prev,
        loading: false,
        error,
        status: "error",
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, text: null, type: null, loading: false, error: null, status: null });
  }, []);

  return { ...state, execute, reset };
}
