# Integration Guide: Scalable Typesense Search

This guide details how to port the **Scalable Multi-Project Search** feature from the prototype into the main "Monolith" Docusaurus project.

## 1. Dependencies

First, install the necessary dependencies in the main project. 
**Note:** If the main project uses React 18/19, you may need `--legacy-peer-deps` due to the Typesense adapter's peer requirements.

```bash
npm install docusaurus-theme-search-typesense typesense-docsearch-react --legacy-peer-deps
```

## 2. Configuration (`docusaurus.config.ts`)

Update the `themeConfig.typesense` section.
**Crucial:** We use specific `query_by` weights and typo tolerance settings to ensure strict, relevant results.

```typescript
themeConfig: {
  typesense: {
    typesenseCollectionName: 'docusaurus-2', // Or your collection name
    typesenseServerConfig: {
      nodes: [
        {
          host: 'localhost', // Or your production host
          port: 8108,
          protocol: 'http',
        },
      ],
      apiKey: 'xyz',
    },
    // STRICT SEARCH PARAMETERS
    typesenseSearchParameters: {
      query_by: 'hierarchy.lvl1,hierarchy.lvl2,hierarchy.lvl3,hierarchy.lvl4,hierarchy.lvl5,hierarchy.lvl6,content',
      query_by_weights: '4,2,2,1,1,1,1',
      min_len_1typo: 4,
      min_len_2typo: 8,
    },
  },
}
```

## 3. The "Search Scope" Component (The UI)

This is the core feature. We have customized the `SearchBar` to inject a chip-based filter **inside** the standard modal.

### A. Copy the Component
Copy the file `website/src/theme/SearchBar/index.tsx` from the prototype to the main project:
`src/theme/SearchBar/index.tsx`

**Key Implementation Details to preserve:**
1.  **Portal Hack:** We use `createPortal` to render the `<FilterBar>` inside the `.DocSearch-Modal` DOM node.
2.  **Mock Hooks:** We mocked `useSearchPage` and `useTypesenseContextualFilters` locally in `index.tsx` to avoid build errors with internal plugin paths. **Do not remove these mocks** unless you have a specific reason to import the internals.
3.  **Autocomplete Logic:** The `FilterBar` component handles the multi-select logic.

### B. Copy the Styles
Copy `website/src/theme/SearchBar/styles.css` to the main project:
`src/theme/SearchBar/styles.css`

**Critical CSS:**
- `.DocSearch-Dropdown { margin-top: 50px !important; }` (Pushes results down)
- `.ProjectFilter-Bar` (Positions the filter bar)

### C. Scaling the Project List
In the prototype `index.tsx`, `AVAILABLE_PROJECTS` is a hardcoded array.
**Action for Main Project:** Replace this array with a dynamic import or a generated JSON file containing all 100+ projects.
```typescript
// Example replacement in src/theme/SearchBar/index.tsx
import projectList from '@site/project-list.json'; 
const AVAILABLE_PROJECTS = projectList;
```

## 4. Infrastructure (Docker)

To run the search engine, add the `typesense` and `typesense-scraper` services to the main `docker-compose.yml`.

```yaml
  typesense:
    image: typesense/typesense:26.0
    restart: on-failure
    ports:
      - "8108:8108"
    volumes:
      - ./typesense-data:/data
    command: '--data-dir /data --api-key=xyz --enable-cors'

  typesense-scraper:
    image: typesense/docsearch-scraper:0.11.0
    network_mode: host # Linux only, use links for Mac/Windows if needed
    environment:
      - CONFIG_FILE_PATH=/config/scraper-config.json
    volumes:
      - ./scraper-config.json:/config/scraper-config.json
```

## 5. Scraper Configuration

Copy `scraper-config.json`.
**Verify:** Ensure the `selectors` map to `hierarchy.lvlX` correctly.

## 6. Build & Verify

1.  Run `npm run build` to ensure the Swizzled component compiles.
2.  Start the stack.
3.  Run the scraper: `docker-compose run typesense-scraper`.
4.  Test the "Add Scope" button in the search modal.
