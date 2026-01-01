# Docusaurus Multi-Tenant Search Extension

This project implements a high-performance, dual-scope search system for Docusaurus. It allows users to toggle between **Local Search** (scoped to a specific project) and **Macro Search** (global across all documentation silos).

---

## 🛠 Technical Architecture: How it Works

### 1. Offline Indexing (The Search Engine)
We use `@easyops-cn/docusaurus-search-local` instead of a SaaS solution like Algolia.
- **Build-Time Crawling:** When `npm run build` is executed, the plugin scans every Markdown file and generates a `search-index.json`.
- **Client-Side Execution:** The browser downloads this index and uses **Lunr.js** to perform searches locally.
- **Why it's Production-Ready:** No external API calls are made, search is nearly instantaneous, and there are no hosting costs for search.

### 2. The "Swizzle" Strategy
Docusaurus allows "ejecting" (swizzling) components from plugins into the local `src/theme` folder.
- **The Rule of Precedence:** Docusaurus prioritizes files in `src/theme` over those in `node_modules`.
- **Customization:** By ejecting the `SearchBar`, we gained direct access to the React code responsible for executing queries and rendering results.

### 3. Portability via Absolute Imports
Standard ejected components use relative paths (e.g., `../../utils`). We converted these to **Absolute Package Paths**:
```javascript
import { searchByWorker } from "@easyops-cn/docusaurus-search-local/dist/client/client/theme/searchByWorker";
```
- **Benefit:** This makes the `src/theme/SearchBar` folder entirely portable. You can copy this folder into any other Docusaurus project, and it will work as long as the plugin is installed.

### 4. Search Context Logic (The "Brain")
The core of the "Macro Search" feature lies in how we handle the `searchContext` variable.

#### Detection (Auto-Scope)
The plugin watches the URL (`location.pathname`). If it matches a path defined in `docusaurus.config.ts` (e.g., `/project_a`), it automatically sets the context to `project_a`.

#### The Override (Macro Toggle)
We introduced a React state `isGlobal`. We modified the `useEffect` hook to implement a priority rule:
1. **If `isGlobal` is TRUE:** We force `setSearchContext("")`. An empty string tells the engine to ignore all filters and search the entire site.
2. **If `isGlobal` is FALSE:** The engine follows the standard auto-detection logic based on the user's current page.

---

## 🚀 How to Port this to Production

To add this feature to an existing project:

1. **Install Plugin:**
   ```bash
   npm install @easyops-cn/docusaurus-search-local
   ```

2. **Configure `docusaurus.config.ts`:**
   Add the plugin and define your `docsRouteBasePath` and `searchContextByPaths`.

3. **Copy Theme Files:**
   Copy the `src/theme/SearchBar` directory from this project to the `src/theme/` directory of your production project.

4. **Verify Build:**
   Search **only** works in production builds. Run:
   ```bash
   npm run build && npm run serve
   ```

---

## ⚠️ Maintenance Notes
- **Development Mode:** The search bar will show a warning in `npm start`. This is normal.
- **Memory:** If building a massive project (thousands of pages), you may need to increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`.
- **CSS:** The toggle is positioned absolutely (`top: -25px`) to avoid breaking existing navbar layouts.