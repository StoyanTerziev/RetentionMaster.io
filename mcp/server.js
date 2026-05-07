#!/usr/bin/env node
"use strict";

const readline = require("node:readline");

const SERVER_NAME = "retentionmaster-mcp";
const SERVER_VERSION = "1.0.0";
const SUPPORTED_PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26"];

const baseUrl = process.env.RM_BASE_URL || "https://retentionmaster.io/api/v1";
const appId = process.env.RM_APP_ID || "";
const appSecret = process.env.RM_APP_SECRET || "";

const tools = [
  {
    name: "retentionmaster_me",
    title: "Inspect RetentionMaster App",
    description: "Validate the configured RetentionMaster app credentials and return workspace/app scope.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "retentionmaster_sites",
    title: "List RetentionMaster Sites",
    description: "List RetentionMaster sites available to the configured app.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "retentionmaster_events",
    title: "Get RetentionMaster Events",
    description: "Pull raw RetentionMaster event rows.",
    inputSchema: {
      type: "object",
      properties: {
        site_id: {
          oneOf: [{ type: "integer" }, { type: "string" }],
          description: "Site id or 'all'.",
        },
        period: {
          type: "string",
          enum: ["today", "last7", "week", "last15", "mtd", "all"],
          description: "Preset reporting period.",
        },
        start: {
          type: "string",
          description: "Custom UTC start datetime.",
        },
        end: {
          type: "string",
          description: "Custom UTC end datetime.",
        },
        action_code: {
          type: "string",
          description: "Exact action code filter.",
        },
        q: {
          type: "string",
          description: "Search user, visitor, session, URL, or referrer.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 500,
          description: "Maximum event rows to return.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "retentionmaster_leads",
    title: "Get RetentionMaster Leads",
    description: "Pull gathered RetentionMaster lead payloads. Requires the leads:read app scope.",
    inputSchema: {
      type: "object",
      properties: {
        site_id: {
          oneOf: [{ type: "integer" }, { type: "string" }],
          description: "Site id or 'all'.",
        },
        period: {
          type: "string",
          enum: ["today", "last7", "week", "last15", "mtd", "all"],
          description: "Preset reporting period.",
        },
        start: {
          type: "string",
          description: "Custom UTC start datetime.",
        },
        end: {
          type: "string",
          description: "Custom UTC end datetime.",
        },
        field_path: {
          type: "string",
          description: "Exact captured field path.",
        },
        popup_id: {
          type: "string",
          description: "Retention asset identifier.",
        },
        action_code: {
          type: "string",
          description: "Exact action code filter.",
        },
        q: {
          type: "string",
          description: "Search captured values, field paths, user, visitor, or session ids.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 250,
          description: "Maximum lead records to return.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "retentionmaster_summary",
    title: "Get RetentionMaster Summary",
    description: "Pull aggregate RetentionMaster event totals by action code and site.",
    inputSchema: {
      type: "object",
      properties: {
        site_id: {
          oneOf: [{ type: "integer" }, { type: "string" }],
          description: "Site id or 'all'.",
        },
        period: {
          type: "string",
          enum: ["today", "last7", "week", "last15", "mtd", "all"],
          description: "Preset reporting period.",
        },
        start: {
          type: "string",
          description: "Custom UTC start datetime.",
        },
        end: {
          type: "string",
          description: "Custom UTC end datetime.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
];

const toolByName = new Map(tools.map((tool) => [tool.name, tool]));

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  send({ jsonrpc: "2.0", id, result: value });
}

function error(id, code, message, data) {
  const payload = { jsonrpc: "2.0", id, error: { code, message } };
  if (data !== undefined) {
    payload.error.data = data;
  }
  send(payload);
}

function requireCredentials() {
  if (!appId || !appSecret) {
    throw new Error("Set RM_APP_ID and RM_APP_SECRET in the MCP server environment.");
  }
}

function buildQuery(args, allowed) {
  const query = new URLSearchParams();
  for (const key of allowed) {
    const value = args[key];
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

async function rmGet(path) {
  requireCredentials();

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    headers: {
      Authorization: `Bearer ${appId}.${appSecret}`,
      Accept: "application/json",
    },
  });

  const raw = await response.text();
  let payload;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = raw;
  }

  if (!response.ok || (payload && payload.ok === false)) {
    const detail = typeof payload === "object" && payload ? payload.error || payload.message : raw;
    throw new Error(detail || `RetentionMaster API failed with HTTP ${response.status}`);
  }

  return payload;
}

async function callTool(name, args = {}) {
  switch (name) {
    case "retentionmaster_me":
      return rmGet("/me");
    case "retentionmaster_sites":
      return rmGet("/sites");
    case "retentionmaster_events":
      return rmGet(
        `/events${buildQuery(args, ["site_id", "period", "start", "end", "action_code", "q", "limit"])}`
      );
    case "retentionmaster_leads":
      return rmGet(
        `/leads${buildQuery(args, [
          "site_id",
          "period",
          "start",
          "end",
          "field_path",
          "popup_id",
          "action_code",
          "q",
          "limit",
        ])}`
      );
    case "retentionmaster_summary":
      return rmGet(`/summary${buildQuery(args, ["site_id", "period", "start", "end"])}`);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleRequest(message) {
  const { id, method, params = {} } = message;

  if (method === "initialize") {
    const requested = params.protocolVersion;
    const protocolVersion = SUPPORTED_PROTOCOLS.includes(requested) ? requested : SUPPORTED_PROTOCOLS[0];
    result(id, {
      protocolVersion,
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      instructions:
        "Use these read-only tools to inspect RetentionMaster app context, sites, events, leads, and summary analytics.",
    });
    return;
  }

  if (method === "ping") {
    result(id, {});
    return;
  }

  if (method === "tools/list") {
    result(id, { tools });
    return;
  }

  if (method === "tools/call") {
    const name = params.name;
    if (!toolByName.has(name)) {
      error(id, -32602, `Unknown tool: ${name}`);
      return;
    }

    try {
      const payload = await callTool(name, params.arguments || {});
      result(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(payload, null, 2),
          },
        ],
      });
    } catch (err) {
      result(id, {
        isError: true,
        content: [
          {
            type: "text",
            text: err instanceof Error ? err.message : String(err),
          },
        ],
      });
    }
    return;
  }

  error(id, -32601, `Method not found: ${method}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  if (!line.trim()) {
    return;
  }

  let message;
  try {
    message = JSON.parse(line);
  } catch (err) {
    error(null, -32700, "Parse error", err instanceof Error ? err.message : String(err));
    return;
  }

  if (!message || message.jsonrpc !== "2.0") {
    error(message && message.id !== undefined ? message.id : null, -32600, "Invalid Request");
    return;
  }

  if (message.id === undefined) {
    return;
  }

  handleRequest(message).catch((err) => {
    error(message.id, -32603, "Internal error", err instanceof Error ? err.message : String(err));
  });
});
