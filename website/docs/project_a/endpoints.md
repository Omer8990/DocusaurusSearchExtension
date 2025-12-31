---
sidebar_position: 3
---

# Endpoints

## GET /widgets

Returns a list of widgets.

**Response:**

```json
[
  {
    "id": 1,
    "name": "Super Widget",
    "price": 19.99
  }
]
```

## POST /widgets

Creates a new widget.

**Body:**

```json
{
  "name": "New Widget",
  "price": 25.00
}
```

