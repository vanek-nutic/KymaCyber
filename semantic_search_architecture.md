# Kimi Cyber - Memory Semantic Search Architecture

**Date:** 2025-11-11

## 1. Overview

This document outlines the proposed architecture for implementing semantic search within the Kimi Cyber memory system. The goal is to enable users to search for memories based on their meaning and context, rather than just exact keywords. The proposed solution is a **client-side architecture** that prioritizes user privacy, cost-effectiveness, and performance.

## 2. Guiding Principles

- **Privacy First:** All user data, including memories and search queries, will remain within the user's browser. No data will be sent to external servers for processing.
- **Cost-Effective:** The solution will not rely on paid APIs for embedding generation, eliminating ongoing operational costs.
- **Performant:** The search functionality should be fast and responsive, providing a seamless user experience.
- **Simplicity:** The architecture should be as simple as possible to implement and maintain, leveraging existing browser technologies.

## 3. Proposed Architecture: Client-Side Semantic Search

We will implement a complete semantic search pipeline directly within the user's browser using the `Transformers.js` library. This approach allows for a fully self-contained and private search experience.

### 3.1. Core Technologies

- **Embedding Generation:** `Transformers.js` will be used to run a lightweight sentence-transformer model directly in the browser. This model will convert text (memories and search queries) into vector embeddings.
- **Vector Storage:** `IndexedDB` will be used to store the generated vector embeddings. IndexedDB is a low-level API for client-side storage of large amounts of structured data, making it ideal for storing embeddings.
- **Similarity Calculation:** A simple cosine similarity function will be implemented in JavaScript to compare the query embedding with the stored memory embeddings.

### 3.2. Data Flow and Workflow

#### 3.2.1. On New Memory Creation/Update

1.  **User Action:** The user creates or updates a memory in the `MemoryPanel`.
2.  **Text Extraction:** The text content of the memory (both key and value) is concatenated.
3.  **Embedding Generation:** The concatenated text is passed to the `Transformers.js` embedding pipeline.
4.  **Vector Creation:** A vector embedding is generated for the memory.
5.  **Storage:** The memory content and its corresponding embedding are stored in `IndexedDB`.

#### 3.2.2. On Search Query

1.  **User Action:** The user types a search query into the search bar in the `MemoryPanel`.
2.  **Query Embedding:** The search query is passed to the `Transformers.js` embedding pipeline to generate a query embedding.
3.  **Embedding Retrieval:** All stored memory embeddings are retrieved from `IndexedDB`.
4.  **Similarity Calculation:** The cosine similarity is calculated between the query embedding and each memory embedding.
5.  **Ranking:** The memories are ranked based on their similarity scores in descending order.
6.  **UI Update:** The `MemoryPanel`'s memory list is re-rendered to display the search results, sorted by relevance.

### 3.3. Component Breakdown

- **`EmbeddingService` (New Module):**
    -   Responsible for initializing the `Transformers.js` pipeline and loading the embedding model.
    -   Provides a function to generate embeddings for a given text.
    -   Will handle model caching to avoid re-downloading.

- **`VectorStore` (New Module):**
    -   An abstraction layer over `IndexedDB` for storing and retrieving vector embeddings.
    -   Provides methods to `add`, `update`, `delete`, and `getAll` embeddings.

- **`MemoryPanel.tsx` (Modification):**
    -   Integrate the `EmbeddingService` and `VectorStore`.
    -   Modify the search functionality to trigger the semantic search pipeline.
    -   Update the UI to display semantically ranked results.
    -   (Optional) Add a toggle to switch between keyword and semantic search.

### 3.4. Diagrammatic Representation

```
+----------------------------------------------------+
|                   MemoryPanel.tsx (UI)             |
+----------------------------------------------------+
|   [ Search Bar ]      [ Add New Memory Form ]      |
+----------------------------------------------------+
      |                      |
      | (Search Query)       | (New Memory Text)
      v                      v
+----------------------------------------------------+
|               EmbeddingService.ts                  |
|      (Transformers.js - `gte-tiny` model)          |
+----------------------------------------------------+
      | (Query Embedding)    | (Memory Embedding)
      v                      v
+----------------------------------------------------+
|                 VectorStore.ts                     |
|                  (IndexedDB)                       |
+----------------------------------------------------+
      | (Similarity Calculation) |
      v                      |
+--------------------------+   | (Store Embedding)
|   Ranked Memory List     |   |
+--------------------------+   v
                             (Success)
```

## 4. Integration Points

- **`MemoryPanel.tsx`:** The primary integration point. The existing `filteredMemories` logic will be replaced with the semantic search results.
- **`saveMemory` function:** After a memory is successfully saved to the Formula API and local cache, a new function will be called to generate and store its embedding.
- **`searchQuery` state:** The `onChange` handler for the search input will trigger the semantic search process.

## 5. Performance and Scalability Considerations

- **Initial Model Load:** The embedding model (~30MB) will be downloaded on the first use and then cached by the browser. This may cause a slight delay on the very first search.
- **Embedding Generation:** Generating embeddings is CPU-intensive. For a small number of memories (<1000), this should be fast enough for a good user experience. Performance will be monitored.
- **Scalability:** The client-side approach is suitable for a personal memory store. If the number of memories grows significantly (>10,000), a server-side solution might be considered in the future. For the current scope, the client-side approach is optimal.

## 6. Fallback Strategy

- The existing keyword-based search will be retained as a fallback mechanism. If the `Transformers.js` model fails to load or an error occurs during embedding generation, the system will gracefully degrade to the keyword search, ensuring that the search functionality is always available.
