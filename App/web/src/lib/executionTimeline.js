const MAX_TEXT_STEP_LENGTH = 180;

function safePreview(value, max = 220) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    return value.length > max ? `${value.slice(0, max)}...` : value;
  }

  try {
    const raw = JSON.stringify(value);
    return raw.length > max ? `${raw.slice(0, max)}...` : raw;
  } catch {
    const raw = String(value);
    return raw.length > max ? `${raw.slice(0, max)}...` : raw;
  }
}

function pushStep(tracker, step) {
  tracker.counter += 1;
  tracker.steps.push({
    id: `timeline-step-${tracker.counter}`,
    at: new Date().toISOString(),
    ...step,
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function extractSignals(payload) {
  const parts = payload?.result?.status?.message?.parts;
  if (!Array.isArray(parts)) return [];

  const signals = [];
  for (const part of parts) {
    if (!part || typeof part !== "object") continue;
    const data = part.data;
    if (!data || typeof data !== "object") continue;
    if (typeof data.type === "string" && data.type.trim()) {
      signals.push(data);
    }
  }
  return signals;
}

function addAgentStatusStep(tracker, statusText) {
  const text = normalizeText(statusText);
  if (!text) return false;
  if (tracker.seenTexts.has(text)) return false;
  tracker.seenTexts.add(text);

  pushStep(tracker, {
    kind: "agent_progress_update",
    status: "info",
    title: text,
  });
  return true;
}

function applySignal(tracker, signal) {
  const signalType = normalizeText(signal?.type);
  if (!signalType) return false;

  if (signalType === "tool_invocation_start") {
    const callId = normalizeText(signal.function_call_id);
    if (callId && tracker.toolCallStepIndex.has(callId)) return false;

    const argsPreview = safePreview(signal.tool_args, 140);
    pushStep(tracker, {
      kind: signalType,
      status: "running",
      title: `Tool: ${normalizeText(signal.tool_name) || "unknown"}`,
      detail: argsPreview || undefined,
      callId: callId || undefined,
    });

    if (callId) {
      tracker.toolCallStepIndex.set(callId, tracker.steps.length - 1);
    }
    return true;
  }

  if (signalType === "tool_result") {
    const callId = normalizeText(signal.function_call_id);
    const resultPreview = safePreview(signal.result_data, 160);
    const resultStatus =
      signal?.result_data && typeof signal.result_data === "object"
        ? normalizeText(signal.result_data.status).toLowerCase()
        : "";
    const isError = resultStatus === "error";

    if (callId && tracker.toolCallStepIndex.has(callId)) {
      const index = tracker.toolCallStepIndex.get(callId);
      const step = tracker.steps[index];
      if (step) {
        step.status = isError ? "error" : "completed";
        step.detail = resultPreview || step.detail;
        step.updatedAt = new Date().toISOString();
      }
      return true;
    }

    pushStep(tracker, {
      kind: signalType,
      status: isError ? "error" : "completed",
      title: `Tool completed: ${normalizeText(signal.tool_name) || "unknown"}`,
      detail: resultPreview || undefined,
      callId: callId || undefined,
    });
    return true;
  }

  if (signalType === "agent_progress_update") {
    return addAgentStatusStep(tracker, signal.status_text);
  }

  if (signalType === "artifact_saved") {
    const key = `${normalizeText(signal.filename)}:${normalizeText(signal.version)}`;
    if (tracker.seenArtifacts.has(key)) return false;
    tracker.seenArtifacts.add(key);
    pushStep(tracker, {
      kind: signalType,
      status: "completed",
      title: `Artifact saved: ${normalizeText(signal.filename) || "artifact"}`,
      detail: signal.version ? `Version ${signal.version}` : undefined,
    });
    return true;
  }

  if (signalType === "artifact_creation_progress") {
    const artifactStatus = normalizeText(signal.status).toLowerCase();
    if (artifactStatus === "in-progress") return false;

    const key = `${normalizeText(signal.filename)}:${artifactStatus}`;
    if (tracker.seenArtifacts.has(key)) return false;
    tracker.seenArtifacts.add(key);

    pushStep(tracker, {
      kind: signalType,
      status: artifactStatus === "failed" ? "error" : "completed",
      title: `${artifactStatus === "failed" ? "Artifact failed" : "Artifact ready"}: ${
        normalizeText(signal.filename) || "artifact"
      }`,
    });
    return true;
  }

  if (signalType === "deep_research_progress") {
    const text = normalizeText(signal.status_text);
    const percent = Number.isFinite(signal.progress_percentage)
      ? ` (${signal.progress_percentage}%)`
      : "";
    return addAgentStatusStep(tracker, `${text}${percent}`);
  }

  if (signalType === "llm_invocation") {
    const model =
      normalizeText(signal?.usage?.model) ||
      normalizeText(signal?.request?.model) ||
      "LLM";
    return addAgentStatusStep(tracker, `LLM call: ${model}`);
  }

  return false;
}

export function createExecutionTimelineTracker() {
  return {
    counter: 0,
    steps: [],
    toolCallStepIndex: new Map(),
    seenTexts: new Set(),
    seenArtifacts: new Set(),
  };
}

export function getExecutionTimelineSnapshot(tracker) {
  if (!tracker) return [];
  return tracker.steps.map((step) => ({ ...step }));
}

export function appendExecutionLifecycleStep(tracker, step) {
  if (!tracker || !step || !step.title) return false;
  pushStep(tracker, {
    kind: step.kind || "lifecycle",
    status: step.status || "info",
    title: step.title,
    detail: step.detail || undefined,
  });
  return true;
}

export function applyStatusUpdateToTimeline(tracker, text, payload) {
  if (!tracker) return false;
  const signals = extractSignals(payload);
  let changed = false;

  for (const signal of signals) {
    changed = applySignal(tracker, signal) || changed;
  }

  if (signals.length === 0) {
    const trimmed = normalizeText(text);
    if (trimmed && trimmed.length <= MAX_TEXT_STEP_LENGTH) {
      changed = addAgentStatusStep(tracker, trimmed) || changed;
    }
  }

  return changed;
}

export function applyArtifactUpdateToTimeline(tracker, payload) {
  if (!tracker) return false;

  const result = payload?.result;
  const artifact = result?.artifact;
  if (!artifact || typeof artifact !== "object") return false;

  const isLastChunk = Boolean(result?.lastChunk ?? result?.last_chunk);
  if (!isLastChunk) return false;

  const artifactName =
    normalizeText(artifact.name) ||
    normalizeText(artifact.filename) ||
    normalizeText(artifact.id) ||
    "artifact";

  const key = `artifact-update:${artifactName}`;
  if (tracker.seenArtifacts.has(key)) return false;
  tracker.seenArtifacts.add(key);

  pushStep(tracker, {
    kind: "artifact_update",
    status: "completed",
    title: `Artifact ready: ${artifactName}`,
  });
  return true;
}
