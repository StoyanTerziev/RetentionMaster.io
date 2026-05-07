# RetentionMaster Public API v1

This folder is designed to be published as a clean public GitHub repository for RetentionMaster API consumers.

## What the API does

RetentionMaster Public API v1 lets approved workspace admins create app credentials and use those credentials from backend services to pull RetentionMaster data.

Supported v1 resources:

- `GET /api/v1/me` - validate credentials and inspect workspace/app scope
- `GET /api/v1/sites` - list sites available to the app
- `GET /api/v1/events` - pull raw event rows
- `GET /api/v1/leads` - pull gathered lead payloads grouped by lead source
- `GET /api/v1/summary` - pull aggregate event totals by action code and site

## Access requirements

- The workspace must be on RM PRO or RM Enterprise.
- The app must be created by a workspace admin in `Platform -> Developers -> API Apps`.
- The app must have the required scope for the endpoint.
- App secrets must only be used from server-side code.

## Authentication

Use one of these methods.

Bearer token:

```bash
Authorization: Bearer APP_ID.APP_SECRET
```

Separate headers:

```bash
X-RM-App-Id: APP_ID
X-RM-App-Secret: APP_SECRET
```

HTTP Basic auth:

```bash
Authorization: Basic base64(APP_ID:APP_SECRET)
```

## Quick start

```bash
curl -H "Authorization: Bearer rm_app_xxx.rmsec_xxx" \
  "https://retentionmaster.io/api/v1/events?period=last7&limit=25"
```

## Filtering events

`GET /api/v1/events` accepts:

- `site_id`: a site id or `all`
- `period`: `today`, `last7`, `week`, `last15`, `mtd`, or `all`
- `start`: custom UTC start datetime
- `end`: custom UTC end datetime
- `action_code`: exact action code filter
- `q`: search user, visitor, session, URL, or referrer
- `limit`: 1-500

## Extracting gathered leads

`GET /api/v1/leads` requires the `leads:read` scope and returns lead records grouped by `source_id`. Each record includes the site, retention asset id, event metadata, visitor/session/user identifiers, and a `fields` object keyed by captured field path.

Accepted filters:

- `site_id`: a site id or `all`
- `period`: `today`, `last7`, `week`, `last15`, `mtd`, or `all`
- `start`: custom UTC start datetime
- `end`: custom UTC end datetime
- `field` or `field_path`: exact captured field path
- `popup_id`: exact retention asset id
- `action_code`: exact action code filter
- `q`: search captured values, field paths, user, visitor, or session ids
- `limit`: 1-250 lead records

## Security practices

- Store `APP_SECRET` in a secret manager.
- Rotate by creating a new app and revoking the old one.
- Use the smallest scopes needed.
- Restrict apps to specific site ids when possible.
- Never put app secrets in frontend JavaScript, mobile binaries, or public repos.

## Model Context Protocol

This repo includes a local Model Context Protocol (MCP) stdio server for AI clients that support MCP tools.

The server exposes read-only RetentionMaster tools:

- `retentionmaster_me`
- `retentionmaster_sites`
- `retentionmaster_events`
- `retentionmaster_leads`
- `retentionmaster_summary`

Run it with Node.js 18+:

```bash
RM_APP_ID=rm_app_xxx RM_APP_SECRET=rmsec_xxx node mcp/server.js
```

Example MCP client configuration:

```json
{
  "mcpServers": {
    "retentionmaster": {
      "command": "node",
      "args": ["mcp/server.js"],
      "env": {
        "RM_APP_ID": "rm_app_xxx",
        "RM_APP_SECRET": "rmsec_xxx"
      }
    }
  }
}
```

Optional env vars:

- `RM_BASE_URL`: defaults to `https://retentionmaster.io/api/v1`

## Files

- `openapi.yaml` - OpenAPI 3.0 contract
- `examples/curl.sh` - shell examples
- `examples/node.js` - Node fetch example
- `examples/php.php` - PHP cURL example
- `mcp/server.js` - local stdio MCP server
