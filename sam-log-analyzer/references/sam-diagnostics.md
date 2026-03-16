# SAM Diagnostics Reference

## Project Context

**SAM (Smart Appetite Manager)** is a multi-agent system built on Solace Agent Mesh. It runs multiple agents communicating via a Solace message broker with an HTTP/SSE web UI gateway.

### Agents

| Agent Name             | Config File                                         | Purpose                            |
|------------------------|-----------------------------------------------------|------------------------------------|
| IngredientParser       | configs/agents/inventory-management/ingredient-parser.yaml | Parse ingredients from text        |
| InventoryDB            | configs/agents/inventory-management/inventory-db.yaml      | SQLite inventory CRUD              |
| InventoryOrchestrator  | configs/agents/inventory-management/inventory-orchestrator.yaml | Coordinate inventory sub-agents |
| ReceiptScanner         | configs/agents/inventory-management/receipt-scanner.yaml   | OCR receipts to extract items      |
| RecipeAssistant        | configs/agents/recipe_assistant.yaml                      | Main recipe agent                  |
| RecipeGeneralSearch    | configs/agents/recipe_general_search.yaml                 | Search recipes by keyword          |
| RecipeInventorySearch  | configs/agents/recipe_inventory_search.yaml                | Search recipes matching inventory  |
| RoutePlannerAgent      | configs/agents/route_planner.yaml                         | Optimize shopping routes           |
| ShopperAgent           | configs/agents/shopper.yaml                               | Find deals and grocery items       |
| OrchestratorAgent      | configs/orchestrator.yaml                                 | Top-level routing orchestrator     |

### Tool Modules

| Module Path                              | Functions |
|------------------------------------------|-----------|
| recipe_agent.mealdb_tools                | 4         |
| inventory_agent.inventory_manager_tools  | 5         |
| shopper_agent.grocery_tools              | 3         |
| receipt_agent.receipt_scanner_tools      | 2         |

### External APIs

| API          | Purpose                 | Common Failures               |
|--------------|-------------------------|-------------------------------|
| Spoonacular  | Recipe search           | HTTP 403 (rate limit / key)   |
| Flipp        | Grocery deals/flyers    | Needs valid postal code       |
| MealDB       | Recipe database         | Free tier limits              |
| Azure Speech | Speech-to-text          | Key/region misconfiguration   |

### Log File

- **Path**: `App/logs/sam_output.log`
- **Format**: `TIMESTAMP | LEVEL | LOGGER_NAME | MESSAGE`
- **Alt format**: `TIMESTAMP - LOGGER - LEVEL - MESSAGE` (root logger at startup)

## Common Problem Patterns

### 1. Agent TTL Expiry / De-registration Cascades

**Symptoms**: Many `AGENT HEALTH CRITICAL` and `AGENT DE-REGISTRATION` warnings.

**Cause**: Agents stop sending heartbeats. Often happens when the Solace broker connection drops or an agent crashes.

**Diagnosis**:
```bash
python scripts/analyze_logs.py App/logs/sam_output.log --mode agents
```

**Fix**: Check broker connectivity. Restart the app. Check for exceptions in the agent's flow.

### 2. SSE Queue Full Warnings

**Symptoms**: Thousands of `SSE queue full for stream viz-stream-...` warnings.

**Cause**: The web UI SSE streams accumulate faster than clients consume them. Often happens with stale browser tabs or many concurrent visualization updates.

**Diagnosis**: These are usually benign but can indicate the UI is not properly cleaning up streams.

**Fix**: Close stale browser tabs. Restart the web UI. If persistent, may indicate a memory leak in the SSE handler.

### 3. Spoonacular API 403

**Symptoms**: `[FAIL] Spoonacular API: HTTP 403` in startup health check.

**Cause**: Invalid API key, expired key, or rate limit exceeded.

**Fix**: Check `SPOONACULAR_API_KEY` in `.env`. Verify key at spoonacular.com dashboard.

### 4. LLM Rate Limiting

**Symptoms**: Slow responses, `rate_limit_init` messages about min-call-interval.

**Cause**: Rate limiter is throttling LLM calls to stay within API limits.

**Diagnosis**: Check `--mode requests` to see call volumes.

### 5. Agent Registration Flapping

**Symptoms**: Same agent appearing in both registration and de-registration logs repeatedly.

**Cause**: Network instability or broker reconnection causing agents to re-announce.

**Diagnosis**:
```bash
python scripts/analyze_logs.py App/logs/sam_output.log --mode agents --agent ShopperAgent
```

## When to Use Context7

Query Context7 (library: `solacelabs/solace-agent-mesh`) when:
- Log errors reference SAM framework internals (e.g., `solace_agent_mesh.*` loggers)
- Agent configuration issues (YAML structure, tool_config patterns)
- Broker connection or subscription problems
- Understanding A2A protocol messages or event handlers
- Session/artifact service errors
