# CloudBroker

Online account-integration scaffold for SolidWorks AI CAD Studio.

This is the correct place to connect a user-owned SOLIDWORKS / 3DEXPERIENCE account. The static dashboard should not store OAuth secrets or platform API credentials.

## What this does now

- exposes `/api/cloud/status`
- exposes `/api/cloud/auth/start` and `/api/cloud/auth/callback`
- accepts dashboard model packages at `/api/cloud/push`
- stores cloud handoff artifacts under `runs/`
- returns a launch URL for the user's 3DEXPERIENCE workspace

## What still needs Dassault approval/configuration

To truly create/update models in a user's online CAD workspace, you need a Dassault/3DEXPERIENCE OAuth application and the relevant platform APIs for the user's tenant.

Configure:

```sh
export THREEDS_AUTH_URL="https://..."
export THREEDS_TOKEN_URL="https://..."
export THREEDS_CLIENT_ID="..."
export THREEDS_CLIENT_SECRET="..."
export THREEDS_REDIRECT_URI="https://your-broker.example.com/api/cloud/auth/callback"
export THREEDS_SPACE_URL="https://my.3dexperience.3ds.com/"
```

Then run:

```sh
node bridge/CloudBroker/server.mjs
```

Dashboard settings:

- `3DEXPERIENCE workspace URL`: your user's platform URL
- `Cloud broker URL`: your deployed CloudBroker URL

## Why this is needed

Browser-only GitHub Pages cannot safely perform OAuth token exchange or directly control a user's SOLIDWORKS/xDesign account. A broker/backend is required for secrets, OAuth callbacks, token refresh, API calls, logging, and access control.
