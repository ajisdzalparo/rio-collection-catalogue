---
name: velomock
description: Automatically create, update, and manage mock REST API endpoints on VeloMock for frontend integration.
---

# VeloMock AI Agent Skill
- VeloMock Origin: `https://velomock-staging.ajisdzalparo.com`
- Fallback Target Backend URL: `https://api.yourdomain.com`
- API Bearer Token: `FFbWRhJfvkGAaLas6u8n_uK8S7T5nEP6PJhCxbtHNTA`

## 1. Create a Mock Endpoint
Send a POST request to `https://velomock-staging.ajisdzalparo.com/api/endpoints` with headers:
`Authorization: Bearer FFbWRhJfvkGAaLas6u8n_uK8S7T5nEP6PJhCxbtHNTA`
`Content-Type: application/json`

Body JSON:
{
  "slug": "unique-slug",
  "path": "/api/v1/resource",
  "method": "GET",
  "statusCode": 200,
  "description": "Mock endpoint description",
  "headers": { "Content-Type": "application/json" },
  "responseData": { "code": 200, "status": "success", "data": [] }
}

Live Mock URL format: `https://velomock-staging.ajisdzalparo.com/api/mock/<slug>/<path>`
Fallback Backend URL: `https://api.yourdomain.com`

## Instructions for AI Agent:
When asked to create or simulate mock data or REST API endpoints, call the VeloMock POST endpoint above using curl/fetch, then provide the live mock URL to the user for immediate frontend integration. Any unmocked endpoints automatically fallback to `https://api.yourdomain.com`.
