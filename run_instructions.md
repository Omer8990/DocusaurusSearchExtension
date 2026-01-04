# Run Instructions

This document outlines the steps to build and run the Docusaurus application using Docker Compose.

## Prerequisites

- **Docker** and **Docker Compose** must be installed on your system.

## Steps to Run

1.  **Build and Start the Container**
    Run the following command in the root directory of the project (where `docker-compose.yml` is located):

    ```bash
    docker-compose up --build -d
    ```

    *   `--build`: Forces a rebuild of the Docker image to ensure any changes in the `website` directory are included.
    *   `-d`: Runs the container in detached mode (in the background).

2.  **Access the Application**
    Once the container is running, open your browser and navigate to:

    [http://localhost:3000](http://localhost:3000)

## Verification

To check if the container is running correctly, you can use:

```bash
docker ps
```

You should see a container named `docusaurus-site` listed.

## Notes

- The application is served using Nginx inside the container (defined in `website/Dockerfile`).
- The `main.py` file in the root directory appears to be unused boilerplate and is not part of the build process.
