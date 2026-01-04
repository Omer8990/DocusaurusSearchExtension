# Run Instructions (Typesense Scalable Search)

This project uses **Typesense** for high-performance, scalable search across all projects.

## Steps to Run

1.  **Start the Services**
    Build and start the Docusaurus site and the Typesense search engine:
    ```bash
    docker-compose up --build -d
    ```

2.  **Index the Content (Crucial)**
    Typesense needs to "crawl" your site to build the search index. Run this whenever you add new docs:
    ```bash
    docker-compose run typesense-scraper
    ```

## Access
- **Website:** [http://localhost:3000](http://localhost:3000)
- **Search Engine API:** [http://localhost:8108](http://localhost:8108)

## Architecture for Scale
- **Docusaurus:** Serves the static content via Nginx.
- **Typesense:** A specialized C++ search engine container that handles the heavy lifting.
- **Scraper:** A tool that reads your HTML and populates the search engine.

## Notes
- If the search bar returns "No results", ensure you have run the `typesense-scraper` command above while the site is running.