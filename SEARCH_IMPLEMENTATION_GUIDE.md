# Comprehensive Guide: Dual-Scope (Local & Macro) Search Implementation

This guide provides a thorough explanation of how to implement a switchable search scope within a Docusaurus project. This feature allows users to toggle between searching within a specific project (Local) and searching across the entire documentation portal (Macro).

---

## 1. The Challenge
In large multi-tenant documentation (where many teams share one Docusaurus instance), users often face two conflicting needs:
1. **Precision:** Searching only within the specific project they are currently reading to avoid noise.
2. **Breadth:** Searching the entire organization's knowledge base to find related information.

Standard search plugins usually support one or the other. This implementation provides both via a runtime toggle.

---

## 2. Technical Stack
- **Docusaurus:** Core framework.
- **Plugin:** `@easyops-cn/docusaurus-search-local` (Provides offline indexing).
- **React:** For state management of the search scope.

---

## 3. Step-by-Step Implementation

### Step 1: Install and Configure the Plugin
First, define your "Projects" in `docusaurus.config.ts`. The search plugin needs to know which paths represent distinct documentation silos.

```typescript
// website/docusaurus.config.ts
plugins: [
  [
    require.resolve('@easyops-cn/docusaurus-search-local'),
    {
      hashed: true,
      // Index all routes
      docsRouteBasePath: ['docs', 'project_a', 'project_b'], 
      // Map paths to "Contexts"
      searchContextByPaths: ['docs', 'project_a', 'project_b'],
      // Ensure the search bar is always visible
      hideSearchBarWithNoSearchContext: false,
    },
  ],
]
```

### Step 2: "Swizzle" the SearchBar
To inject custom logic, you must "eject" the plugin's UI component into your source code.

Run:
```bash
npm run swizzle @easyops-cn/docusaurus-search-local SearchBar -- --eject --danger
```

This creates files in `src/theme/SearchBar/`.

### Step 3: Fix Broken Relative Imports
When you eject a component from a package, its internal relative imports (e.g., `import x from "../../utils"`) will break because the folder depth has changed. You must rewrite these to absolute package paths.

**Example Fix in `SearchBar.jsx`:**
- **Wrong:** `import { searchByWorker } from "../searchByWorker";`
- **Right:** `import { searchByWorker } from "@easyops-cn/docusaurus-search-local/dist/client/client/theme/searchByWorker";`

*Note: You must repeat this for every utility import in `SearchBar.jsx`, `SuggestionTemplate.js`, and `index.jsx`.*

### Step 4: Add the Scope Toggle Logic
In `src/theme/SearchBar/SearchBar.jsx`, introduce a state to control whether the search should ignore the current project context.

#### 4.1 Define the State
```javascript
const [isGlobal, setIsGlobal] = useState(false);
```

#### 4.2 Intercept Context Detection
The plugin automatically detects your project based on the URL. We must override this if `isGlobal` is checked.

```javascript
useEffect(() => {
    if (isGlobal) {
        // Clearing the context forces the engine to search the entire index (Macro Search)
        setSearchContext(""); 
        return;
    }
    // ... existing path-matching logic follows here ...
}, [location.pathname, versionUrl, isGlobal]);
```

#### 4.3 Update the UI
Insert a checkbox or toggle into the JSX. Positioning it absolutely is often the safest way to avoid breaking the navbar layout.

```jsx
<div style={{ position: 'absolute', top: '-25px', right: '0' }}>
    <label>
        <input 
            type="checkbox" 
            checked={isGlobal} 
            onChange={(e) => setIsGlobal(e.target.checked)} 
        />
        Search All Projects
    </label>
</div>
```

---

## 4. Operational Maintenance

### 4.1 Production vs. Development
- **Development (`npm start`):** The search index is **not** generated. You will see a warning: "Search index is only available when you run docusaurus build". This is expected behavior to keep development fast.
- **Production (`npm run build`):** The plugin crawls every page and generates a `search-index.json`.

### 4.2 Large Index Optimization
For very large projects, your search index might exceed 5MB. 
- **Recommendation:** Enable `hashed: true` in config to help with browser caching.
- **Recommendation:** Use `indexDocs: true` but `indexBlog: false` if your blog is massive and secondary to technical docs.

---

## 5. Summary of Architecture
1. **The Plugin** creates a giant map of every word in every project.
2. **The `searchContext`** acts as a filter on that map.
3. **The Toggle** allows the user to programmatically remove that filter at runtime.

This approach gives your users the power of a "Global Portal" while maintaining the focus of "Project Documentation".

---

## 6. Scalability & Limitations
This solution utilizes **Client-Side Search**, meaning the entire search index must be downloaded and parsed by the user's browser.

### 6.1 Performance Thresholds
- **Small Scale (< 1,000 pages):** Excellent performance. Instant results.
- **Medium Scale (1,000 - 5,000 pages):** Good performance. Index size ~2-5MB.
- **Large Scale (> 5,000 pages):** Performance degrades.
    - **Initial Load:** Users may see a delay before search is ready.
    - **Memory:** "Search All" may freeze the UI on low-end devices or mobile.
    - **Build Time:** The `docusaurus build` process will take significantly longer to generate the index.

### 6.2 "Hundreds of Projects" Risk
If you scale to hundreds of projects, the combined index size will likely exceed browser limits for a smooth experience. The "Search All" feature will force the browser to load the entire dataset, potentially causing **tab crashes** or **browser unresponsiveness**.

### 6.3 Solution for High Scale
For massive documentation sets, migrating to a **Server-Side Search** solution (like Algolia DocSearch, Typesense, or Elasticsearch) is required. These services handle the indexing and querying on a remote server, sending only the results to the client.
