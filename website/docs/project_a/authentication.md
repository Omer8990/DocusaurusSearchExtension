---
sidebar_position: 2
---

# Authentication

Project A uses API keys to allow access to the API. You can register a new Project A API key at our [developer portal](http://localhost:3000/).

Project A expects for the API key to be included in all API requests to the server in a header that looks like the following:

```text
Authorization: Bearer <YOUR_API_KEY>
```

## Rotating Credentials

If you believe your keys have been compromised, you can generate new ones in the settings panel.

