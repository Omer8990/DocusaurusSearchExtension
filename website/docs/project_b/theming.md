---
sidebar_position: 2
---

# Theming

Project B uses CSS variables for theming. You can override these in your `:root` or specific class scope.

```css
:root {
  --pb-primary-color: #007bff;
  --pb-secondary-color: #6c757d;
  --pb-font-family: 'Inter', sans-serif;
}
```

## Dark Mode

Native support for dark mode is included.

```css
[data-theme='dark'] {
  --pb-primary-color: #375a7f;
}
```

