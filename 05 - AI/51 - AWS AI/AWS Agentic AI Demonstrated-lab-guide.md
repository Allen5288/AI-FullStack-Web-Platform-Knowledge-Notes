# Rebuilding a Broken Agentic AI System on Amazon Bedrock AgentCore

**A complete walkthrough of the AnyCompany Logistics supply chain lab**

---

## Table of contents

1. [Introduction](#1-introduction)
2. [What you are building](#2-what-you-are-building)
3. [Why each component exists](#3-why-each-component-exists)
4. [Recommended execution order](#4-recommended-execution-order)
5. [Reference values](#5-reference-values)
6. [Task 1 — OAuth 2.0 authentication](#6-task-1--oauth-20-authentication)
7. [Task 2 — Gateway tool routing](#7-task-2--gateway-tool-routing)
8. [Task 3 — Knowledge base and specialist agent runtime](#8-task-3--knowledge-base-and-specialist-agent-runtime)
9. [Task 4 — AgentCore Memory](#9-task-4--agentcore-memory)
10. [Task 5 — Bedrock Guardrails](#10-task-5--bedrock-guardrails)
11. [Task 6 — VPC networking](#11-task-6--vpc-networking)
12. [The orchestrator environment variable set](#12-the-orchestrator-environment-variable-set)
13. [Troubleshooting reference](#13-troubleshooting-reference)
14. [Traps worth memorising](#14-traps-worth-memorising)

---

## 1. Introduction

### The scenario

AnyCompany Logistics runs a supply chain management application. The company had begun migrating that application onto Amazon Bedrock AgentCore, Amazon's managed platform for running production AI agents. Partway through the migration, the engineer leading the work left. What remains is a half-finished system: some infrastructure is deployed, some is misconfigured, and some was never created at all. The application's chat interface returns "Authentication service unavailable" and nothing works end to end.

Your job is to finish the migration.

### Why this is structured as a repair job rather than a build

Building from an empty account teaches you the happy path. Repairing a partially-built system teaches you something more useful: how to read the state of a deployed system, work out which layer is broken, and fix it without disturbing what already works.

That distinction matters because the failure modes in agentic systems are unusually indirect. An agent that returns a plausible but wrong answer might be failing at authentication, at tool discovery, at retrieval, or at the model layer — and the symptom in the chat window can look identical in all four cases. Much of the skill this lab measures is knowing where to look.

### What the finished system does

When you are done, a user types a question into a web chat interface. Behind that box, an orchestrator agent authenticates, decides which of its capabilities the question needs, and routes accordingly:

- **A question about live data** ("where is shipment SH-4471?") → the orchestrator calls a tool through AgentCore Gateway, which invokes a Lambda function against the operational data.
- **A question about documented policy** ("what's our procedure for receiving inventory?") → the orchestrator delegates to a separate knowledge base specialist agent, which retrieves passages from indexed company documents.
- **Anything the user said earlier** ("I prefer detailed reports") → persisted in AgentCore Memory and recalled in later sessions.

Every request and response passes through content safety filters, and all of it runs inside a private network.

---

## 2. What you are building

### The six components

| # | Component | Role in the system |
|---|---|---|
| 1 | **Amazon Cognito OAuth 2.0** | Issues the machine-to-machine tokens that let the web app's Lambda talk to the agent, and the agent talk to the Gateway |
| 2 | **AgentCore Gateway** | Exposes four Lambda functions as tools the agent can discover and call, using the Model Context Protocol (MCP) |
| 3 | **Knowledge base + specialist runtime** | Turns a bucket of company documents into searchable passages, served by a dedicated agent the orchestrator delegates to |
| 4 | **AgentCore Memory** | Extracts and persists facts and preferences from conversations so context survives across sessions |
| 5 | **Bedrock Guardrails** | Blocks harmful content, blocks a confidential project name, masks discount codes and usernames, blocks passwords |
| 6 | **VPC networking** | Moves both agent runtimes off the public internet and routes AWS service traffic through PrivateLink endpoints |

### How the pieces connect

```
                        User's browser
                              │
                    CloudFront (chat UI)
                              │
                    supply-chain-chat Lambda
                              │  ← Cognito M2M token
                              ▼
                  ┌───────────────────────┐
                  │  Orchestrator Agent   │ ← Guardrails on input/output
                  │      Runtime          │ ← Memory read/write
                  └───────────────────────┘
                       │              │
              MCP over │              │ A2A invocation
              HTTPS    │              │
                       ▼              ▼
          ┌────────────────────┐   ┌──────────────────────┐
          │ AgentCore Gateway  │   │ KB Specialist        │
          └────────────────────┘   │ Agent Runtime        │
            │    │    │    │       └──────────────────────┘
            ▼    ▼    ▼    ▼                  │
        inventory supplier logistics          ▼
                       quality        Bedrock Knowledge Base
         (four Lambda functions)              │
                                              ▼
                                   OpenSearch Serverless
                                    (vector index)
                                              │
                                              ▼
                                   supply-chain-knowledge
                                        (S3 documents)

  All of the above, once Task 6 is done, runs inside a VPC with
  interface endpoints for AgentCore, AgentCore Gateway, Bedrock
  Runtime, and CloudWatch Logs — plus NAT for Cognito.
```

---

## 3. Why each component exists

Understanding the purpose of each layer makes the configuration steps memorable rather than arbitrary.

### Authentication: why machine-to-machine and not a login page

The chat Lambda is not a user. It is a backend service acting on its own behalf, so it uses the OAuth 2.0 **client credentials** grant: it presents a client ID and secret to Cognito's token endpoint and receives an access token. No human interaction, no redirect, no password.

That token then has to be *accepted* on the other end. The Gateway and both agent runtimes are configured with JWT authorizers, and each authorizer holds a list of client IDs it will trust. The broken state of the lab is exactly this: the authorizers trust a client ID that no longer works properly, so every token is rejected.

Two details follow from the nature of client credentials:

- **Scopes are mandatory.** In the client credentials grant there is no user to derive permissions from, so the scopes attached to the app client *are* the authorisation model. A client with no scopes cannot be issued a usable token.
- **Validate on `client_id`, not `aud`.** Cognito's client-credentials access tokens carry a `client_id` claim and no `aud` claim. Configuring the authorizer around allowed audience instead of allowed clients rejects every token.

### Gateway: why a tool layer at all

The agent could, in principle, be given code that calls each Lambda directly. Gateway exists so it doesn't have to be. It sits between the agent and its tools and provides:

- **Discovery.** The agent connects to one MCP endpoint and learns what tools exist. Adding a fifth domain later requires no change to the agent.
- **Schema translation.** Each target carries a tool schema describing its operations and parameters, which is what lets the model construct valid calls.
- **A single credential boundary.** The Gateway's IAM role invokes the Lambdas. The agent never holds Lambda permissions.

### Knowledge base: why a separate specialist agent

The knowledge base itself is a retrieval pipeline — documents chunked, embedded into vectors, indexed for semantic search. The interesting design decision is putting a *second agent* in front of it rather than giving the orchestrator retrieval tools directly.

The reasons are the ones that motivate service boundaries generally: the specialist can use a different model or prompt tuned for retrieval and citation; it can be scaled, deployed, and secured independently; and the orchestrator's own prompt stays focused on routing rather than accumulating retrieval logic. The orchestrator reaches it through agent-to-agent (A2A) invocation, which is why the specialist needs its own JWT authorizer and its own endpoint.

### Memory: why extraction is asynchronous

AgentCore Memory does not simply log the transcript. It runs extraction strategies over raw conversation events and writes structured records into namespaces:

- **Semantic** — facts stated in conversation
- **User preference** — how this person wants to be dealt with
- **Session summary** — a condensation of one session

Extraction uses a model, so it happens after the fact, typically 30 to 60 seconds later. This is why the lab tells you to wait before validating, and why "I tested immediately and nothing was stored" is not evidence of a misconfiguration.

The namespace strings matter more than they look. They contain placeholders — `{actorId}`, `{sessionId}` — that the runtime substitutes per user and per session. The agent's memory hooks read from specific paths, so a namespace that differs by one character means writes succeed and reads silently return nothing.

### Guardrails: why both directions

The application handles supplier discount codes, internal project names, and personal data. Guardrails apply policies to prompts *and* responses, which covers two distinct risks: a user trying to extract confidential data, and the agent volunteering it unprompted from a retrieved document.

The policy types are worth distinguishing because the lab tests the difference:

- **Word filter** — exact string matching. Correct for a known secret project name.
- **Denied topic** — semantic, model-evaluated. Wrong for this task, and a common mistake.
- **Content filter** — categories like hate or violence, with strength settings.
- **Sensitive information** — built-in PII types plus custom regex patterns, each set to block or mask.

### VPC: why endpoints and NAT both

Moving the runtimes into a VPC removes their public network exposure. But an agent with no route out is useless — it needs to reach Bedrock for model inference, the Gateway for tools, the AgentCore data plane for A2A and memory, and CloudWatch for logs.

Interface endpoints (PrivateLink) solve this for services that support them: traffic reaches the service without leaving the AWS network. Cognito has no interface endpoint, so its traffic goes out through the NAT gateway instead. Both paths must work, which is why verifying the private subnets' default route is not optional busywork.

The setting that most often defeats this task is **private DNS**. Without it enabled on an interface endpoint, the runtime resolves the service's public hostname, the traffic never enters the endpoint, and the symptom is indistinguishable from the endpoint not existing.

---

## 4. Recommended execution order

The lab presents the challenges in its own order. This is a better order to work in:

| Order | Task | Why here |
|---|---|---|
| 1 | OAuth 2.0 | Everything downstream needs working tokens. Debugging anything else first means debugging through an auth failure. |
| 2 | Gateway routing | Auth is now known-good, so any remaining tool failure is a routing problem. |
| 3 | Knowledge base | Ingestion takes minutes. Start the sync, then deploy the specialist runtime while it runs. |
| 4 | Memory | Independent of the others. Extraction needs a 60-second wait, so start the test early. |
| 5 | Guardrails | Self-contained. Doing it late avoids its masking behaviour confusing earlier tests. |
| 6 | VPC | **Always last.** Moving runtimes into a VPC before they work turns every bug into a network bug. |

### One habit that saves real time

Tasks 2, 3, 4, and 6 all edit the orchestrator runtime, and **each save creates a new runtime version that takes minutes to roll out**. Batch the changes: collect the values you need first, then make one edit. If you must edit repeatedly, at least combine an authorizer change and an environment variable change into a single save.

---

## 5. Reference values

Lab-provisioned resources for this session. The `cb979c70` suffix is session-specific.

| Name | Value |
|---|---|
| Region | `us-east-1` |
| Account | `287175949191` |
| Application URL | `https://d153ibs6008sh3.cloudfront.net` |
| Cognito user pool | `us-east-1_LpAg24smf` |
| Cognito domain | `https://supply-chain-cb979c70.auth.us-east-1.amazoncognito.com` |
| Cognito discovery URL | `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_LpAg24smf/.well-known/openid-configuration` |
| Schema bucket | `agent-schema-bucket-cb979c70` |
| Knowledge base bucket | `supply-chain-knowledge-cb979c70` |
| Chat Lambda | `supply-chain-chat-cb979c70` |
| Logistics Lambda | `logistics-handler-cb979c70` |
| Quality Lambda | `quality-handler-cb979c70` |
| Gateway role | `arn:aws:iam::287175949191:role/AgentCoreGatewayRole-cb979c70` |
| KB specialist role | `arn:aws:iam::287175949191:role/KBSpecialistRuntimeRole-cb979c70` |
| KB specialist code | `s3://agent-schema-bucket-cb979c70/agent_code/kb_specialist_agent.zip` |
| KB specialist model | `amazon.nova-lite-v1:0` |
| OpenSearch collection | `arn:aws:aoss:us-east-1:287175949191:collection/g0qj1gse8wc6j1igyimj` |
| VPC | `vpc-07742a597fe6a8e9b` |
| Private subnets | `subnet-0c90a6f5e5eba8cfb`, `subnet-01a75aac76768461b` |
| Security group | `sg-0fc5e38801766fc9c` |

IAM roles and policies are preconfigured. No IAM changes are required for any task.

---

## 6. Task 1 — OAuth 2.0 authentication

### Problem

The Cognito app client was created without a client secret or OAuth flow configuration, making machine-to-machine authentication impossible. The chat Lambda is also missing the environment variables it needs to invoke the orchestrator runtime. The UI shows "Authentication service unavailable".

### Step 1 — Create the machine-to-machine app client

Cognito console → **User pools** → `us-east-1_LpAg24smf` → **App clients** → **Create app client**.

- **Application type**: Machine-to-machine application
- **Name**: `supply-chain-m2m-client`
- **Client secret**: leave as **Generate a client secret**

No callback URLs and no identity providers — those belong to user-facing clients.

### Step 2 — Configure the OAuth grant and scopes

This is a **separate section from the create wizard**, and missing it is the most common failure on this task.

On the app client's page, open the hosted authentication section — labelled **Login pages** in the current console — and click **Edit**:

- **OAuth 2.0 grant types** → check **Client credentials**, nothing else
- **Custom scopes** → check both `supplychain/read` and `supplychain/write`
- **OpenID Connect scopes** → leave all unchecked

Cognito rejects the client credentials grant if any standard OIDC scope (`openid`, `email`, `profile`) is selected.

Save, then copy the **Client ID**.

> **Note on the "Edit app client information" page:** that page covers the name, user sign-in flows, and token lifetimes. None of it affects M2M validity. `ALLOW_REFRESH_TOKEN_AUTH` being checked there is normal and cannot be disabled.

### Step 3 — Update the Gateway JWT authorizer

AgentCore console → **Gateways** → the supply chain gateway → **Edit**.

In the inbound authorization section, find **Allowed clients** (`allowedClients`), remove the old client ID, add the new one. Leave the discovery URL unchanged.

Use allowed **clients**, not allowed audience — see the reasoning in [section 3](#3-why-each-component-exists).

### Step 4 — Update the orchestrator runtime

AgentCore → **Agent Runtime** → orchestrator → **Edit**. Make both changes in one save:

**Inbound authorization** → swap the client ID in allowed clients.

**Environment variables**:

```
COGNITO_DOMAIN       = https://supply-chain-cb979c70.auth.us-east-1.amazoncognito.com
COGNITO_CLIENT_ID    = <new client ID>
COGNITO_USER_POOL_ID = us-east-1_LpAg24smf
```

Copy the runtime ARN before you leave. Save and wait for **Ready**.

### Step 5 — Configure the chat Lambda

Lambda console → `supply-chain-chat-cb979c70` → **Configuration** → **Environment variables**:

```
ORCHESTRATOR_RUNTIME_ARN = <runtime ARN>
COGNITO_DOMAIN           = https://supply-chain-cb979c70.auth.us-east-1.amazoncognito.com
COGNITO_CLIENT_ID        = <new client ID>
COGNITO_USER_POOL_ID     = us-east-1_LpAg24smf
```

Two things to confirm in the function's **Code** tab rather than assume:

- **Domain format.** If the code builds `f"{domain}/oauth2/token"`, the full `https://` URL with no trailing slash is right. If it builds `f"https://{domain}/..."`, strip the scheme.
- **Client secret handling.** The task lists no secret variable, implying the Lambda fetches it via `cognito-idp:DescribeUserPoolClient`. Verify that in the code; do not add a secret variable speculatively.

### Success criteria

A message sent through the chat UI returns a response from the orchestrator agent.

---

## 7. Task 2 — Gateway tool routing

### Problem

Three faults: `GATEWAY_URL` on the orchestrator runtime is empty, so MCP tool discovery never happens; the logistics target points at the inventory handler, so shipment queries return inventory data; and the quality target was never created.

### Step 1 — Collect two values

**Gateway endpoint URL** — from the gateway's detail page:

```
https://supply-chain-gateway-cb979c70-xsr5pvwgku.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp
```

Keep the `/mcp` path. That is the MCP endpoint the client connects to.

**Quality schema key** — locate `quality_tools.json` in `agent-schema-bucket-cb979c70` and note its full key, including any prefix.

### Step 2 — Fix the logistics target

Gateway → **Targets** → **logistics-target** → **Edit**. Change the Lambda ARN to:

```
arn:aws:lambda:us-east-1:287175949191:function:logistics-handler-cb979c70
```

Change nothing else — the name, schema, and credential provider are already correct. Save and wait for **READY**.

### Step 3 — Create the quality target

Targets → **Add target**:

- **Name**: `quality-target` — the naming convention is graded
- **Type**: Lambda
- **Lambda ARN**: `arn:aws:lambda:us-east-1:287175949191:function:quality-handler-cb979c70`
- **Tool schema**: S3 → `agent-schema-bucket-cb979c70` / `quality_tools.json`
- **Credential provider**: Gateway IAM role — open a working target first and mirror its setting

> **Target type matters.** `quality_tools.json` is an MCP tool schema — an array of objects with `name`, `description`, and `inputSchema` — not an OpenAPI specification. Choose the Lambda target type. Selecting OpenAPI fails validation.

The file defines three tools:

| Tool | Required parameters |
|---|---|
| `check_quality` | none (`product_id`, `batch_id` optional) |
| `get_compliance` | `entity_id`, `entity_type` |
| `get_standards` | none (`product_category` optional) |

Save and wait for **READY**.

### Step 4 — Set GATEWAY_URL

Orchestrator runtime → **Edit** → **Environment variables**:

```
GATEWAY_URL = https://supply-chain-gateway-cb979c70-xsr5pvwgku.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp
```

The variable is empty rather than absent, so fill in the existing key rather than adding a duplicate. Save and wait for **Ready**.

### Step 5 — Verify all four domains

In the chat UI:

| Domain | Test prompt |
|---|---|
| Inventory | "What's the current stock level for [SKU]?" |
| Supplier | "Who supplies [product]?" |
| Logistics | "What's the status of shipment [ID]?" |
| Quality | "What are the quality standards for electronics?" |

The logistics test is the decisive one: it must return shipment data, not inventory data.

### Success criteria

The orchestrator discovers all tools from the Gateway and executes inventory, supplier, logistics, and quality operations.

---

## 8. Task 3 — Knowledge base and specialist agent runtime

### Problem

The orchestrator delegates knowledge base queries via A2A invocation, but neither the knowledge base nor the specialist runtime exists. The OpenSearch Serverless collection and vector index are already deployed.

### Step 1 — Read the vector index field names

OpenSearch console → **Serverless** → **Collections** → the collection matching `g0qj1gse8wc6j1igyimj` → **Indexes** → `bedrock-knowledge-base-index` → mappings.

Note three field names and the declared vector dimension. The conventional names are:

| Purpose | Typical name |
|---|---|
| Vector field | `bedrock-knowledge-base-default-vector` |
| Text field | `AMAZON_BEDROCK_TEXT_CHUNK` |
| Metadata field | `AMAZON_BEDROCK_METADATA` |

**Read them off the index rather than trusting these defaults.** A mismatch here is the leading cause of knowledge base creation failing, and the error message does not identify the field.

### Step 2 — Create the knowledge base

Use **Knowledge Bases (KB)** in the left nav → **Create** → **Knowledge Base with vector store**.

> **Do not use Quickstart.** The Quickstart flow creates a *managed* vector store: Bedrock hosts the index internally and selects the embedding model itself. There is no vector store section to configure and no Titan model to choose, so the task's requirements cannot be met. If your knowledge base overview shows **Knowledge base type: Managed vector store** and **Embeddings model: Managed**, delete it and start again.

**Step 1 of the wizard:**
- Name: `supply-chain-kb`
- IAM role: **Use an existing service role** → `KnowledgeBaseRole-cb979c70`
- Data source type: S3

**Step 2:**
- S3 URI: `s3://supply-chain-knowledge-cb979c70`
- Leave chunking at default

**Step 3 — the step that matters:**

The vector store section defaults to **Quick create a new vector store**. Switch to **Choose a vector store you have created**. Only then do the OpenSearch options appear.

- **Embeddings model**: Titan Text Embeddings V2 (`amazon.titan-embed-text-v2:0`)
- **Vector store**: Amazon OpenSearch Serverless → collection `g0qj1gse8wc6j1igyimj`
- **Vector index name**: `bedrock-knowledge-base-index`
- **Field names**: the three from Step 1

If Titan V2's default 1024 dimensions does not match the index, set the matching dimension (V2 supports 1024, 512, 256).

### Step 3 — Sync the data source

KB detail page → **Data source** → select → **Sync**.

Copy the **Knowledge Base ID** now and continue to Step 4 while ingestion runs. Return later and confirm the sync shows **Completed** with documents ingested. Confirm the bucket actually contains the three expected documents — inventory procedures, supplier manual, quality control manual. An empty sync succeeds and tells you nothing.

### Step 4 — Deploy the specialist runtime

AgentCore → **Agent Runtime** → create:

- **Name**: `kb_specialist_runtime` — must contain `kb`, `specialist`, or `knowledge`
- **Artifact**: `s3://agent-schema-bucket-cb979c70/agent_code/kb_specialist_agent.zip`
- **Entry point**: `main.py`
- **Runtime**: `PYTHON_3_11`
- **Protocol**: `HTTP`
- **Execution role**: `arn:aws:iam::287175949191:role/KBSpecialistRuntimeRole-cb979c70`

**Authorizer**: `CUSTOM_JWT`
- Discovery URL: the Cognito discovery URL
- Allowed clients: the app client ID from Task 1

**Environment variables**:

```
MODEL_ID          = amazon.nova-lite-v1:0
KNOWLEDGE_BASE_ID = <KB ID>
```

No VPC configuration yet — that is Task 6.

### Step 5 — Create the default endpoint

Check the runtime's **Endpoints** section. If a `DEFAULT` endpoint was not created automatically, create one against the current version. A2A invocation targets the endpoint, not the runtime version, so without it the orchestrator cannot reach the specialist.

Copy the runtime ARN.

### Step 6 — Wire it to the orchestrator

Orchestrator runtime → **Edit** → **Environment variables**:

```
KB_SPECIALIST_RUNTIME_ARN = <specialist runtime ARN>
```

Save and wait for **Ready**.

### Step 7 — Verify

Once the sync shows **Completed**, ask something only the documents can answer:

- "What's our procedure for receiving inventory?"
- "What does the quality control manual say about inspection frequency?"

A verbatim passage means success. A generic model answer means the query is not reaching the knowledge base.

### Success criteria

The orchestrator routes knowledge base queries to the specialist runtime and returns relevant passages from supply chain documents.

---

## 9. Task 4 — AgentCore Memory

### Problem

The orchestrator treats every message as independent. Its code already contains memory hooks and an `AgentCoreMemorySessionManager`, but no memory resource exists.

### Step 1 — Create the memory resource

AgentCore → **Memory** → **Create memory**.

- **Name**: `supply_chain_memory`
- **Event expiry duration**: 30 days
- **Execution role**: as offered

### Step 2 — Add three built-in strategies

Scroll to **Long-term memory extraction strategies** and use the **Built-in strategies** box — the first of the three boxes. Click **Add strategy** once per strategy.

The other two boxes are for cases this task does not need: *built-in with override* lets you substitute the extraction model or prompt template; *self-managed* means you run the extraction pipeline yourself.

| Strategy type | Namespace |
|---|---|
| Semantic | `supplychain/user/{actorId}/semantic` |
| User preference | `supplychain/user/{actorId}/preferences` |
| Session summary | `supplychain/user/{actorId}/session/{sessionId}/summary` |

The namespace field arrives pre-filled with a default such as `/strategies/{memoryStrategyId}/actors/{actorId}`. Replace it entirely.

Checks that matter:

- No leading slash — begin with `supplychain`
- `{actorId}` and `{sessionId}` in exact camelCase, braces included
- `preferences` is plural; `semantic` is singular
- No trailing slash
- Three *different* strategy types, not three semantic strategies

Create, then copy the **Memory ID** — for example `supply_chain_memory-UzZkls7ogr`. Not the ARN.

### Step 3 — Wire it to the orchestrator

Orchestrator runtime → **Edit** → **Environment variables**:

```
MEMORY_ID = supply_chain_memory-UzZkls7ogr
```

Scroll to the bottom and **save**. The environment variable form shows Remove buttons and an "Add new variable" button while you are still editing — leaving the page without saving discards everything. Wait for **Ready**.

### Step 4 — Test and wait

In the chat UI:

```
My name is Alex and I prefer detailed reports.
```

Wait a full 60 seconds. Extraction is asynchronous and there is nothing to poll from the UI.

> If Guardrails (Task 5) is already configured, the name may come back masked because `USERNAME` is set to anonymize. This is expected and does not indicate a memory failure — the preference is still extracted.

### Step 5 — Verify recall in a new session

The success criterion is recall **in a new session**. Start a fresh one — a new chat control, or reload the page if that clears history — then ask:

```
What do you know about my reporting preferences?
```

If the same session recalls it but a fresh session does not, only short-term context is working; re-check the user preference namespace.

### Success criteria

The orchestrator recalls a stated user preference in a new session.

---

## 10. Task 5 — Bedrock Guardrails

### Problem

The orchestrator has no content filtering. The application handles supplier discount codes (`DISC-XXX-0000`), internal project names, and personal data, all of which could surface in responses.

The agent code already supports `guardrail_id` and `guardrail_version` parameters, and `GUARDRAIL_VERSION` is already set to `DRAFT`.

### Step 1 — Create the guardrail with custom messaging

Bedrock console → **Guardrails** → **Create guardrail**.

- **Name**: `supply-chain-guardrail`
- **Blocked prompt message**: e.g. "Your request cannot be processed because it violates our content policy."
- **Blocked response message**: e.g. "The response was blocked because it contained restricted content."

Both are required — the task asks for custom messaging on inputs *and* outputs. Neither should be left at a default.

### Step 2 — Content filters

Set to **High** for both prompts and responses:

| Category | Strength |
|---|---|
| Hate | High |
| Insults | High |
| Misconduct | High |
| Violence | High |

Sexual and prompt attack are not part of the requirement — leave them as they are rather than disabling them.

### Step 3 — Skip denied topics

The requirement is a **word filter**, not a denied topic. Configuring Project Meridian as a denied topic is the classic miss on this task.

### Step 4 — Word filters

- Enable **Filter profanity**
- Add custom word/phrase: `Project Meridian`

### Step 5 — Sensitive information

**PII types:**

| Type | Action |
|---|---|
| `USERNAME` | Mask (anonymize) |
| `PASSWORD` | Block |

**Regex pattern:**

| Field | Value |
|---|---|
| Name | `DiscountCode` |
| Pattern | `DISC-[A-Z]{3}-\d{4}` |
| Action | Mask |

Type the regex rather than pasting from a rendered document — an escaped backslash or a typographic hyphen fails silently.

### Step 6 — Create and collect the ID

Skip contextual grounding, create, then copy the **Guardrail ID** (e.g. `m7x2hqwnr9hz`) — not the ARN.

No version needs publishing. `GUARDRAIL_VERSION` is `DRAFT`, which points at the working draft.

### Step 7 — Wire it to the orchestrator

Orchestrator runtime → **Edit** → **Environment variables**:

```
GUARDRAIL_ID = m7x2hqwnr9hz
```

Save and wait for **Ready**.

### Step 8 — Verify

Three prompts in the chat UI:

| Test | Expected |
|---|---|
| Mention Project Meridian | Blocked with your custom message |
| Ask the agent to repeat `DISC-ABC-1234` | Returned masked |
| Include profanity | Blocked |

If Project Meridian blocks but discount codes pass through, the regex is at fault. If nothing filters at all, the environment variable has not reached the running endpoint.

### Success criteria

The orchestrator blocks mentions of Project Meridian, anonymizes discount codes, blocks PII, and filters harmful content.

---

## 11. Task 6 — VPC networking

### Problem

Both runtimes are deployed with public network access. All outbound traffic — model invocations, Gateway tool calls, A2A, memory — traverses the public internet.

The VPC already has public subnets, private subnets, a NAT gateway, and an S3 gateway endpoint.

### Step 1 — Create four interface endpoints

An interface endpoint is a private doorway from your VPC to one AWS service. Four services need doorways, so build four. **Every setting is identical except the service name.**

| # | Service name | Purpose |
|---|---|---|
| 1 | `com.amazonaws.us-east-1.bedrock-agentcore` | AgentCore data plane — A2A and memory |
| 2 | `com.amazonaws.us-east-1.bedrock-agentcore.gateway` | Gateway — tool calls |
| 3 | `com.amazonaws.us-east-1.bedrock-runtime` | Model inference (Nova Lite) |
| 4 | `com.amazonaws.us-east-1.logs` | CloudWatch Logs |

Filtering the service list on `bedrock-agentcore` returns three results. **Skip `bedrock-agentcore-control`** — that is the management API for creating and editing resources, which the agents do not use at runtime.

For each endpoint, VPC console → **Endpoints** → **Create endpoint**:

1. **Type**: AWS services
2. **Service name**: one from the table
3. **VPC**: `vpc-07742a597fe6a8e9b`
4. **Subnets**: both `subnet-0c90a6f5e5eba8cfb` and `subnet-01a75aac76768461b`
5. **Security group**: `sg-0fc5e38801766fc9c` — remove the auto-selected default group
6. **Enable DNS name**: checked
7. **Policy**: Full access
8. **Create**

Wait for all four to reach **Available**.

Two settings decide whether this task works:

- **Private DNS on all four.** Without it, the runtime resolves the public hostname and traffic bypasses the endpoint entirely.
- **The same security group on all four endpoints and both runtimes.** Different groups means the runtimes cannot reach the doorways.

### Step 2 — Verify the S3 endpoint and NAT routing

These are pre-provisioned; the task asks you to verify, not create:

- **Endpoints** → an S3 endpoint of type **Gateway** exists
- **NAT gateways** → one exists and is Available
- **Route tables** → the table associated with the two private subnets has `0.0.0.0/0` pointing at the NAT gateway

The route table check is the important one. Cognito has no interface endpoint, so token validation depends on NAT. Without a default route, the runtimes lose authentication the moment they enter VPC mode.

### Step 3 — Switch the KB specialist runtime

Do the simpler runtime first.

`kb_specialist_runtime` → **Edit** → network configuration:
- **Public** → **VPC**
- VPC: `vpc-07742a597fe6a8e9b`
- Subnets: both private subnets
- Security group: `sg-0fc5e38801766fc9c`

Save. This takes several minutes. Wait for **READY** before continuing.

### Step 4 — Switch the orchestrator runtime

Identical network settings. Leave all environment variables untouched. Save, wait for **READY**, and confirm the endpoint is serving the new version.

### Step 5 — Verify end to end

VPC mode can break any earlier task, so re-run the key checks:

- A Gateway tool query — "what's the status of shipment X?"
- A knowledge base query — "what does the quality control manual say about inspections?"
- The application status panel shows **VPC: Active** alongside the other five components

### Success criteria

Both runtimes run in VPC mode, and the chat UI returns correct responses for Gateway tool queries and knowledge base queries with all AWS service traffic routing through VPC endpoints.

---

## 12. The orchestrator environment variable set

After all six tasks, the orchestrator runtime should carry exactly these:

| Key | Value | Set in |
|---|---|---|
| `COGNITO_CLIENT_ID` | `v0sgg5lo8bjtmh5bfngi9n8bd` | Task 1 |
| `COGNITO_DOMAIN` | `https://supply-chain-cb979c70.auth.us-east-1.amazoncognito.com` | Task 1 |
| `COGNITO_USER_POOL_ID` | `us-east-1_LpAg24smf` | Task 1 |
| `GATEWAY_URL` | `https://supply-chain-gateway-cb979c70-xsr5pvwgku.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp` | Task 2 |
| `KB_SPECIALIST_RUNTIME_ARN` | `arn:aws:bedrock-agentcore:us-east-1:287175949191:runtime/kb_specialist_...` | Task 3 |
| `MEMORY_ID` | `supply_chain_memory-UzZkls7ogr` | Task 4 |
| `GUARDRAIL_ID` | `m7x2hqwnr9hz` | Task 5 |
| `GUARDRAIL_VERSION` | `DRAFT` | Pre-set |
| `MODEL_ID` | `amazon.nova-pro-v1:0` | Pre-set |

The application's status panel reads these variables. A component showing **OFF** means its variable is absent from the *running* version — either the edit was never saved, or the endpoint has not finished rolling out.

> `MODEL_ID` on the orchestrator is `nova-pro`, while the KB specialist uses `nova-lite`. This is deliberate: the reference values specify Nova Lite for the specialist via `KBSpecialistModelId`. Leave the orchestrator's model as provisioned.

---

## 13. Troubleshooting reference

### Symptom to cause

| Symptom | Most likely cause |
|---|---|
| "No valid machine-to-machine app client found" | OAuth grant type or custom scopes not configured (a separate section from the create wizard) |
| `invalid_client` from the token endpoint | Wrong client ID, or the client has no secret |
| `invalid_scope` | Scopes not attached to the app client |
| Token issued but the runtime rejects it | Allowed clients not updated, or the endpoint still serving the old version |
| No tools discovered at all | `GATEWAY_URL` wrong — usually a missing or extra `/mcp` |
| Some tools work, quality does not | Quality target not READY, or schema key wrong |
| Tools discovered, invocation returns auth error | Credential provider on the new target differs from working targets |
| Shipment queries return inventory data | Logistics target ARN not updated, or the wrong target was edited |
| Knowledge base creation fails with a vague error | Vector index field names or dimension mismatch |
| No vector store section in the KB wizard | Managed / Quickstart knowledge base type — recreate with a self-managed vector store |
| Generic answers with no citations | Orchestrator not delegating — check `KB_SPECIALIST_RUNTIME_ARN` and the default endpoint |
| Specialist reached but returns nothing | Sync incomplete or `KNOWLEDGE_BASE_ID` wrong |
| Memory shows OFF in the status panel | `MEMORY_ID` not saved, or rollout incomplete |
| Namespaces empty after 60+ seconds | Namespace string mismatch |
| Recall works in-session but not in a new session | User preference strategy namespace wrong |
| Nothing filtered by guardrails | `GUARDRAIL_ID` not reaching the running endpoint |
| Project Meridian blocked but codes unmasked | Regex pattern typo |
| Everything fails after VPC switch | Bedrock Runtime endpoint missing, private DNS off, or security group mismatch |
| Auth errors after VPC switch | NAT routing on the private subnets |
| Tools fail after VPC switch, chat works | Gateway endpoint |
| KB queries fail after VPC switch, tools work | AgentCore data plane endpoint |
| No logs at all | CloudWatch Logs endpoint — fix first, everything else is harder to debug without it |

### Log locations

| Component | Log group |
|---|---|
| Chat Lambda | `/aws/lambda/supply-chain-chat-cb979c70` |
| Quality Lambda | `/aws/lambda/quality-handler-cb979c70` |
| Agent runtimes | `/aws/bedrock-agentcore/runtimes/...` |

The chat Lambda log is the most useful single place to start: it shows whether the token was obtained, and whether the runtime invocation succeeded.

---

## 14. Traps worth memorising

### The pattern behind most failures

**Creating a resource is not the same as configuring it.** Across these tasks, the graded setting repeatedly lives in a *separate* edit section that the create wizard does not force you through:

- Cognito app client → OAuth grant and scopes are under Login pages, not the create form
- Knowledge base → the vector store choice is on wizard step 3, and its default is wrong for the task
- Memory → strategies are an optional section, easily skipped
- Guardrails → the sensitive information policy is its own wizard step

When a grader says a resource is invalid but the resource plainly exists, look for the section you did not visit.

### Specific traps

| Trap | Correct behaviour |
|---|---|
| Denied topic vs word filter | Project Meridian needs a **word filter**. Exact string, not semantic. |
| Allowed audience vs allowed clients | Cognito M2M tokens have `client_id`, not `aud`. Use allowed clients. |
| OIDC scopes with client credentials | Uncheck `openid`, `email`, `profile`. Cognito rejects the combination. |
| Client secret after creation | Cannot be added later. Recreate the client. |
| Quickstart knowledge base | Creates a managed vector store. Use the full wizard and switch off quick-create. |
| Guessed vector index field names | Read them from the index mappings. |
| OpenAPI vs MCP tool schema | `quality_tools.json` is an MCP schema. Choose a Lambda target. |
| Memory ID vs ARN | Environment variables take the ID. |
| Guardrail ID vs ARN | Same. |
| Namespace placeholders | Exact camelCase `{actorId}`, `{sessionId}`. `preferences` plural. |
| Leaving an edit form unsaved | Scroll down and save. Remove buttons on screen mean you are still editing. |
| Testing before rollout | Every save creates a version. Wait for **READY**. |
| Private DNS unchecked | Traffic bypasses the endpoint. Indistinguishable from a missing endpoint. |
| Default security group on endpoints | Replace with the specified group on all four endpoints and both runtimes. |
| VPC before everything works | Do VPC last. |
| Testing memory immediately | Extraction takes 30–60 seconds. |
| Testing memory recall in the same session | The criterion is recall in a **new** session. |

### Time management

The lab runs 130 minutes and cannot be paused. Three operations dominate the clock:

| Operation | Duration |
|---|---|
| Knowledge base ingestion sync | Several minutes |
| Runtime version rollout after any edit | 1–3 minutes, per save |
| Runtime switch from Public to VPC mode | Several minutes, per runtime |

Start the knowledge base sync as early as possible and work on other tasks while it runs. Batch orchestrator environment variable edits into as few saves as you can. Budget generously for Task 6, which involves two sequential slow rollouts and cannot be parallelised safely.
