---
sidebar_position: 3
---

# Configuration

The CLI is configured via a `project-c.yaml` file in the root of your repository.

## Example

```yaml
version: 1.0
project:
  name: my-app
  region: us-east-1

deploy:
  replicas: 3
  memory: 512MB
```

