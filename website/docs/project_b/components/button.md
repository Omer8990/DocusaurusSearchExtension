---
sidebar_position: 1
---

# Button

The `Button` component is used to trigger an action or event, such as submitting a form, opening a dialog, or canceling an action.

## Usage

```jsx
import { Button } from '@project-b/core';

function App() {
  return <Button variant="primary">Click Me</Button>;
}
```

## Props

| Name | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' | 'secondary'` | `'primary'` | The visual style of the button. |
| `size` | `'sm' | 'md' | 'lg'` | `'md'` | The size of the button. |
| `disabled` | `boolean` | `false` | Whether the button is interactive. |
