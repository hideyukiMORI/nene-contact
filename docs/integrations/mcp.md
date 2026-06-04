# MCP — local server for NeNe Contact

NeNe Contact ships a local **MCP** (Model Context Protocol) server so AI agents can read the
inbox safely. It is a thin JSON-RPC 2.0 stdio process that maps each tool to a **Contact
OpenAPI operation only** — never a sibling database (ADR 0002). It reuses the framework's
`Nene2\Mcp\LocalMcpServer` and the project tool catalog `docs/mcp/tools.json`.

## Tools (read-only)

| Tool | OpenAPI operation | Notes |
| --- | --- | --- |
| `contact_list_forms` | `GET /api/forms` | form structure/metadata only |
| `contact_list_submissions` | `GET /api/submissions` | redacted by default; `include_pii=true` is audit-logged |
| `contact_get_submission` | `GET /api/submissions/{id}` | redacted by default; `include_pii=true` is audit-logged |

All tools are **redacted by default** (no IP/user-agent, masked field values, charter §11).
`include_pii=true` returns raw values and is **audit-logged** server-side (`submission.exported`
for the list, `submission.viewed` for one). There are no write tools yet (a later M6 slice adds
them behind a confirmation token).

## Run

The server talks JSON-RPC over stdin/stdout. It needs the running Contact app's base URL and
the machine API key that gates `/api/*`:

```bash
NENE_CONTACT_API_BASE_URL=http://localhost:8900 \
NENE2_MACHINE_API_KEY=your-machine-key \
php tools/local-mcp-server.php
```

- `NENE_CONTACT_API_BASE_URL` — base URL of the running app (default `http://localhost:8900`).
  Inside Docker, use the app service URL reachable from the MCP process.
- `NENE2_MACHINE_API_KEY` — must match the app's `NENE2_MACHINE_API_KEY`; sent as
  `X-NENE2-API-Key`. Without it `/api/*` returns 401.

## Client configuration (example)

```json
{
  "mcpServers": {
    "nene-contact": {
      "command": "php",
      "args": ["tools/local-mcp-server.php"],
      "env": {
        "NENE_CONTACT_API_BASE_URL": "http://localhost:8900",
        "NENE2_MACHINE_API_KEY": "your-machine-key"
      }
    }
  }
}
```

## Keeping the catalog honest

`composer mcp` (part of `composer check`) validates that every tool in `docs/mcp/tools.json`
maps to a real OpenAPI operation (matching `operationId`, method, and path). Add a tool by
adding the OpenAPI operation first, then the catalog entry.

## Related

- [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) (§11 AI/MCP)
- [`../openapi/openapi.yaml`](../openapi/openapi.yaml) (the surface tools map to)
- [`../milestones/m6-ai-mcp-siblings.md`](../milestones/m6-ai-mcp-siblings.md)
- ADR 0002 (HTTP-only siblings)
