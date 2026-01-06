# CENADI Document Search System

## Technical Migration Proposal: Elasticsearch to Milvus Vector Database

---

**Document Version:** 1.0  
**Date:** January 5, 2026  
**Classification:** Internal - Technical Proposal  
**Prepared by:** Technical Architecture Team

---

## Table of Contents

1. Executive Summary
2. Current System Architecture
3. Proposed Architecture with Milvus
4. Comparative Analysis
5. Feature Mapping and Compatibility
6. Security and Access Control
7. Implementation Plan
8. Risk Assessment and Mitigation
9. Resource Requirements
10. Timeline and Milestones
11. Recommendations

---

## 1. Executive Summary

### 1.1 Purpose

This document presents a comprehensive technical proposal for migrating the CENADI Document Search System from the current Elasticsearch and FSCrawler-based architecture to a modern vector database solution using Milvus. The proposal aims to evaluate the feasibility, benefits, challenges, and implementation strategy for this migration.

### 1.2 Background

The current document search system relies on Elasticsearch for full-text indexing and search capabilities, combined with FSCrawler for document crawling, OCR processing, and text extraction. While this architecture has served the organization's needs, emerging vector database technologies offer potential improvements in search relevance, semantic understanding, and system simplification.

### 1.3 Scope

This proposal covers:

- Technical comparison between current and proposed architectures
- Feature compatibility assessment
- Security considerations for division-based access control
- Implementation roadmap and resource requirements
- Risk assessment and mitigation strategies

### 1.4 Key Findings

The analysis concludes that migration to Milvus is technically feasible and offers several advantages including semantic search capabilities, reduced infrastructure complexity, and improved page-level document indexing. However, the migration requires careful planning to maintain existing functionality, particularly regarding text highlighting and file monitoring capabilities.

---

## 2. Current System Architecture

### 2.1 Architecture Overview

The existing CENADI Document Search System comprises four primary containerized components operating within a Docker environment:

**Component 1: Elasticsearch (Version 8.17.0)**

- Purpose: Document indexing and full-text search
- Function: Stores extracted document content and metadata, provides BM25-based search ranking
- Resource Allocation: Approximately 2GB RAM

**Component 2: FSCrawler**

- Purpose: Document crawling and text extraction
- Function: Monitors file directories, performs OCR on PDF documents using Tesseract, extracts text content, and indexes documents into Elasticsearch
- Key Features: Automatic file watching, PDF OCR support, metadata extraction

**Component 3: PostgreSQL Database**

- Purpose: User management and application data
- Function: Stores user accounts, roles, divisions, and session information

**Component 4: Next.js Application**

- Purpose: Web interface and API layer
- Function: Provides search interface, document preview with page partitioning, and user authentication

### 2.2 Current Search Capabilities

The system currently supports:

- Keyword-based full-text search using BM25 algorithm
- Fuzzy matching for approximate term matching
- Date-based filtering (today, this week, this month, this year)
- Document type filtering
- Search result highlighting with matched terms
- Division-based access control through path filtering

### 2.3 Document Processing Flow

1. Documents are placed in monitored directories organized by division
2. FSCrawler detects new or modified files
3. OCR processing extracts text from scanned PDFs
4. Extracted content and metadata are indexed in Elasticsearch
5. Users search through the web interface
6. Results are filtered based on user division and role
7. Document preview shows relevant pages with highlighted search terms

### 2.4 Current Limitations

- Search is purely keyword-based; semantically similar terms are not matched
- Page-level indexing is not performed; the entire document is indexed as a single unit
- Client-side PDF processing is required to identify matching pages
- Multiple components increase operational complexity
- Total system memory requirement exceeds 4GB

---

## 3. Proposed Architecture with Milvus

### 3.1 Architecture Overview

The proposed architecture replaces Elasticsearch and FSCrawler with Milvus vector database and a custom Python-based document processing service:

**Component 1: Milvus Vector Database (Version 2.4+)**

- Purpose: Vector storage, similarity search, and full-text search
- Function: Stores document embeddings, supports hybrid search combining semantic and keyword matching
- Resource Allocation: Approximately 1-2GB RAM

**Component 2: Etcd**

- Purpose: Milvus metadata storage
- Function: Distributed key-value store required by Milvus
- Resource Allocation: Minimal (approximately 256MB RAM)

**Component 3: Document Processing Service (Python)**

- Purpose: Document crawling, OCR, and embedding generation
- Function: Monitors directories, extracts text using Tesseract, generates vector embeddings, indexes into Milvus
- Key Libraries: PyMuPDF, pytesseract, sentence-transformers, watchdog

**Component 4: PostgreSQL Database**

- Purpose: User management (unchanged)

**Component 5: Next.js Application**

- Purpose: Web interface and API layer (modified for Milvus integration)

### 3.2 Proposed Search Capabilities

The new system will support:

- Keyword-based full-text search (BM25 algorithm, native in Milvus 2.4+)
- Semantic similarity search using vector embeddings
- Hybrid search combining both approaches for optimal results
- All existing filtering capabilities (date, type, division)
- Page-level search results with pre-indexed page information
- Division-based access control through scalar field filtering

### 3.3 Proposed Document Processing Flow

1. Documents are placed in monitored directories organized by division
2. Python service detects new or modified files using watchdog library
3. OCR processing extracts text from scanned PDFs (page by page)
4. Each page is converted to a vector embedding using sentence-transformers
5. Page content, embedding, and metadata are indexed in Milvus
6. Users search through the web interface
7. Results include exact page numbers containing matches
8. Document preview directly navigates to matching pages

### 3.4 Embedding Model Considerations

The proposed solution uses locally-hosted embedding models, eliminating dependency on external APIs. Given that CENADI documents are primarily in **French and English**, a multilingual embedding model is essential to ensure accurate semantic search across both languages.

**Recommended Model: paraphrase-multilingual-MiniLM-L12-v2**

- Embedding Dimension: 384
- Model Size: Approximately 420MB
- Supported Languages: 50+ languages including French and English
- Inference Speed: Fast (suitable for real-time indexing)
- License: Apache 2.0 (free for commercial use)
- Hosting: Local execution within the Python service container
- Key Advantage: Cross-lingual semantic matching (a French query can find relevant English documents and vice versa)

#### Why Multilingual Support is Critical

- CENADI documents contain a mix of French and English content
- Users may search in French for documents written in English (or vice versa)
- Multilingual models understand semantic meaning across language boundaries
- Example: Searching "politique de conge" (French) will also find documents about "vacation policy" (English)

#### Model Comparison

| Model                                 | Dimensions | Size  | Languages    | Best For                                                     |
| ------------------------------------- | ---------- | ----- | ------------ | ------------------------------------------------------------ |
| paraphrase-multilingual-MiniLM-L12-v2 | 384        | 420MB | 50+          | Recommended - Best balance of speed and multilingual quality |
| paraphrase-multilingual-mpnet-base-v2 | 768        | 1.1GB | 50+          | Higher accuracy, requires more memory                        |
| distiluse-base-multilingual-cased-v2  | 512        | 480MB | 15           | Good alternative, slightly different architecture            |
| all-MiniLM-L6-v2                      | 384        | 80MB  | English only | Not recommended for multilingual environments                |

---

## 4. Comparative Analysis

### 4.1 Infrastructure Comparison

| Aspect                      | Current Architecture                       | Proposed Architecture                      |
| --------------------------- | ------------------------------------------ | ------------------------------------------ |
| Number of Docker Containers | 5 (ES, Kibana, FSCrawler, PostgreSQL, App) | 4 (Milvus, Etcd, PostgreSQL, App + Python) |
| Estimated Memory Usage      | 4-5 GB                                     | 2-3 GB                                     |
| Storage Requirements        | Moderate                                   | Similar                                    |
| Network Complexity          | Moderate                                   | Lower                                      |
| External Dependencies       | None                                       | None (local embedding model)               |

### 4.2 Search Capability Comparison

| Capability            | Current Architecture | Proposed Architecture             |
| --------------------- | -------------------- | --------------------------------- |
| Keyword Search        | Yes (BM25)           | Yes (BM25)                        |
| Fuzzy Matching        | Yes                  | Yes                               |
| Semantic Search       | No                   | Yes                               |
| Hybrid Search         | No                   | Yes                               |
| Synonym Matching      | Manual configuration | Automatic via semantics           |
| Cross-language Search | No                   | Possible with multilingual models |

### 4.3 Document Processing Comparison

| Aspect               | Current Architecture      | Proposed Architecture    |
| -------------------- | ------------------------- | ------------------------ |
| OCR Engine           | Tesseract (via FSCrawler) | Tesseract (via Python)   |
| OCR Quality          | Standard                  | Standard (identical)     |
| Indexing Granularity | Document level            | Page level               |
| Metadata Extraction  | Automatic (FSCrawler)     | Custom (Python)          |
| File Format Support  | Extensive (FSCrawler)     | PDF, Images (extensible) |
| Processing Speed     | Moderate                  | Similar                  |

### 4.4 Advantages of Proposed Architecture

**Search Quality Improvements:**

- Semantic search enables finding documents based on meaning rather than exact keywords
- Users searching for "employee vacation policy" can find documents titled "Annual Leave Guidelines"
- Reduced reliance on users knowing exact terminology

**Performance Improvements:**

- Page-level indexing eliminates client-side PDF scanning
- Pre-computed page matches enable instant navigation to relevant content
- Reduced memory footprint allows deployment on smaller infrastructure

**Operational Simplification:**

- Fewer containers reduce operational complexity
- Unified vector database handles both storage and search
- Python-based processing service offers greater customization flexibility

**Future Capabilities:**

- Foundation for advanced features such as document similarity
- Potential for question-answering systems using retrieval-augmented generation
- Easier integration with machine learning workflows

### 4.5 Disadvantages and Challenges

**Implementation Complexity:**

- Requires development of custom document processing service
- Migration of existing indexed documents necessary
- Learning curve for Milvus administration

**Feature Gaps:**

- Native highlighting not available; requires custom implementation
- FSCrawler's extensive file format support must be replicated
- File watching requires additional implementation

**Operational Considerations:**

- New technology stack requires team training
- Milvus community smaller than Elasticsearch
- Embedding model updates may require reindexing

**Risk Factors:**

- Less mature technology compared to Elasticsearch
- Fewer third-party tools and integrations available
- Documentation and community support less extensive

---

## 5. Feature Mapping and Compatibility

### 5.1 Search Features

| Current Feature     | Milvus Equivalent            | Implementation Effort |
| ------------------- | ---------------------------- | --------------------- |
| Full-text search    | BM25 index (native)          | Low                   |
| Fuzzy matching      | BM25 with tokenization       | Low                   |
| Date filtering      | Scalar field filter          | Low                   |
| Type filtering      | Scalar field filter          | Low                   |
| Path filtering      | Scalar field filter          | Low                   |
| Result highlighting | Custom implementation        | Medium                |
| Search suggestions  | Vector similarity on queries | Medium                |

### 5.2 Document Processing Features

| Current Feature         | Milvus Equivalent     | Implementation Effort |
| ----------------------- | --------------------- | --------------------- |
| PDF text extraction     | PyMuPDF library       | Low                   |
| OCR processing          | pytesseract library   | Low                   |
| Automatic file watching | watchdog library      | Medium                |
| Metadata extraction     | Custom Python code    | Medium                |
| Incremental updates     | Custom implementation | Medium                |
| Deleted file handling   | Custom implementation | Medium                |

### 5.3 Application Features

| Current Feature               | Migration Impact        | Implementation Effort |
| ----------------------------- | ----------------------- | --------------------- |
| Search interface              | API endpoint changes    | Low                   |
| PDF preview with partitioning | Enhanced with page data | Low (improvement)     |
| Highlighting in PDF           | Unchanged (client-side) | None                  |
| User authentication           | Unchanged               | None                  |
| Division-based filtering      | Scalar field filter     | Low                   |
| Document upload               | Modified indexing call  | Low                   |

---

## 6. Security and Access Control

### 6.1 Current Security Model

The existing system implements Role-Based Access Control (RBAC) through path filtering:

- Users are assigned to divisions (e.g., DEL, DRH, CENADI)
- Document access is controlled by matching document paths with user divisions
- The CENADI Director role bypasses division restrictions
- Filtering occurs at the Elasticsearch query level

### 6.2 Proposed Security Model

The proposed system maintains equivalent security through scalar field filtering in Milvus:

**Division Field Storage:**

- Each indexed page includes a "division" field extracted from the file path
- Division values are stored as scalar VARCHAR fields
- Additional fields for user_id enable user-specific document filtering

**Query-Level Filtering:**

- Milvus filter expressions provide equivalent functionality to Elasticsearch query filters
- Example filter: `division == "DEL" OR division == "SHARED"`
- Role-based bypass logic remains in application layer

**Security Comparison:**

| Security Aspect         | Current Implementation   | Proposed Implementation          |
| ----------------------- | ------------------------ | -------------------------------- |
| Division-based access   | Path wildcard filter     | Scalar field equality filter     |
| Role-based bypass       | Application logic        | Application logic (unchanged)    |
| User-specific documents | user_id field filter     | user_id field filter             |
| Query-level enforcement | Elasticsearch bool query | Milvus filter expression         |
| Data isolation          | Index-level              | Collection-level or filter-level |

### 6.3 Security Considerations

**Equivalent Security Posture:**

- The proposed architecture maintains the same security model
- No reduction in access control capabilities
- Filter expressions are enforced at the database level

**Additional Security Options:**

- Milvus supports collection-level access control for stronger isolation
- Partition keys can separate divisions for improved performance
- API-level authentication remains unchanged

---

## 7. Implementation Plan

### 7.1 Phase 1: Infrastructure Setup (Week 1-2)

**Objective:** Establish Milvus infrastructure in development environment

**Tasks:**

1. Create Docker Compose configuration for Milvus and Etcd
2. Configure Milvus collection schema with required fields
3. Set up Python document processing service container
4. Install and configure embedding model
5. Validate basic connectivity and operations

**Deliverables:**

- Docker Compose file for new infrastructure
- Milvus collection with defined schema
- Functional Python service skeleton
- Infrastructure validation report

### 7.2 Phase 2: Document Processing Service (Week 2-4)

**Objective:** Develop document processing capabilities equivalent to FSCrawler

**Tasks:**

1. Implement PDF text extraction using PyMuPDF
2. Integrate Tesseract OCR for scanned documents
3. Develop page-level text chunking logic
4. Implement embedding generation using sentence-transformers
5. Create Milvus indexing functions
6. Implement file watching using watchdog library
7. Develop metadata extraction utilities
8. Create document update and deletion handlers

**Deliverables:**

- Complete document processing service
- File watching and monitoring system
- OCR and text extraction pipeline
- Unit tests for processing components

### 7.3 Phase 3: Search API Development (Week 4-5)

**Objective:** Create API endpoints for hybrid search with RBAC

**Tasks:**

1. Develop Milvus client library for Next.js
2. Implement hybrid search combining BM25 and vector similarity
3. Port division-based filtering logic
4. Implement result aggregation and ranking
5. Develop highlighting logic using stored text
6. Create search suggestion endpoint using vector similarity

**Deliverables:**

- Milvus client library
- Search API endpoints
- Filter and RBAC implementation
- API documentation

### 7.4 Phase 4: Frontend Integration (Week 5-6)

**Objective:** Update frontend to utilize new search capabilities

**Tasks:**

1. Update search result components for page-level results
2. Modify PDF viewer to accept server-provided page numbers
3. Implement client-side highlighting using stored text
4. Update search filters and suggestions
5. Conduct user interface testing

**Deliverables:**

- Updated search interface
- Modified PDF viewer component
- Frontend integration tests

### 7.5 Phase 5: Data Migration (Week 6-7)

**Objective:** Migrate existing documents to new system

**Tasks:**

1. Develop migration script for existing documents
2. Execute full reindexing of document corpus
3. Validate data integrity and completeness
4. Compare search results between systems
5. Address any discrepancies

**Deliverables:**

- Migration scripts
- Data validation report
- Search comparison analysis

### 7.6 Phase 6: Testing and Validation (Week 7-8)

**Objective:** Comprehensive testing of migrated system

**Tasks:**

1. Functional testing of all search features
2. Security testing of RBAC implementation
3. Performance testing and optimization
4. User acceptance testing
5. Documentation completion

**Deliverables:**

- Test reports
- Performance benchmarks
- User acceptance sign-off
- Complete documentation

### 7.7 Phase 7: Deployment and Cutover (Week 8-9)

**Objective:** Deploy to production and complete migration

**Tasks:**

1. Deploy new infrastructure to production environment
2. Execute production data migration
3. Conduct parallel operation period
4. Complete cutover to new system
5. Decommission legacy components

**Deliverables:**

- Production deployment
- Cutover documentation
- Decommissioning plan
- Post-migration support plan

---

## 8. Risk Assessment and Mitigation

### 8.1 Technical Risks

**Risk 1: Search Quality Regression**

- Description: New system may produce lower quality search results for certain queries
- Probability: Medium
- Impact: High
- Mitigation: Implement parallel search comparison during testing phase; tune hybrid search weights based on user feedback

**Risk 2: OCR Quality Differences**

- Description: Custom OCR implementation may differ from FSCrawler results
- Probability: Low
- Impact: Medium
- Mitigation: Use identical Tesseract configuration; validate OCR output against existing indexed content

**Risk 3: Performance Degradation**

- Description: Vector search may introduce latency for large document collections
- Probability: Low
- Impact: Medium
- Mitigation: Implement appropriate indexing; optimize embedding model selection; benchmark performance early

**Risk 4: Embedding Model Limitations**

- Description: Selected embedding model may not capture domain-specific terminology
- Probability: Medium
- Impact: Medium
- Mitigation: Evaluate multiple models during development; consider fine-tuning for domain vocabulary

### 8.2 Operational Risks

**Risk 5: Team Learning Curve**

- Description: Team unfamiliarity with Milvus may slow development and operations
- Probability: Medium
- Impact: Medium
- Mitigation: Allocate training time; engage with Milvus community; document operational procedures

**Risk 6: Dependency on New Technology**

- Description: Milvus is less mature than Elasticsearch with smaller community
- Probability: Medium
- Impact: Low
- Mitigation: Maintain rollback capability; monitor Milvus project health; document troubleshooting procedures

### 8.3 Project Risks

**Risk 7: Timeline Overrun**

- Description: Implementation may take longer than estimated
- Probability: Medium
- Impact: Medium
- Mitigation: Build buffer into timeline; prioritize core features; plan for phased delivery

**Risk 8: Scope Creep**

- Description: Additional features may be requested during implementation
- Probability: Medium
- Impact: Medium
- Mitigation: Clearly define scope boundaries; defer enhancements to future phases

### 8.4 Risk Summary Matrix

| Risk                         | Probability | Impact | Priority |
| ---------------------------- | ----------- | ------ | -------- |
| Search Quality Regression    | Medium      | High   | High     |
| OCR Quality Differences      | Low         | Medium | Low      |
| Performance Degradation      | Low         | Medium | Medium   |
| Embedding Model Limitations  | Medium      | Medium | Medium   |
| Team Learning Curve          | Medium      | Medium | Medium   |
| Dependency on New Technology | Medium      | Low    | Low      |
| Timeline Overrun             | Medium      | Medium | Medium   |
| Scope Creep                  | Medium      | Medium | Medium   |

---

## 9. Resource Requirements

### 9.1 Infrastructure Resources

**Development Environment:**

- Docker host with minimum 8GB RAM
- 50GB storage for documents and indexes
- Network connectivity for container communication

**Production Environment:**

- Docker host with minimum 8GB RAM (reduced from current 10GB+)
- 100GB+ storage based on document volume
- Backup storage for database and vector index

### 9.2 Software Dependencies

**New Components:**

- Milvus 2.4 or later
- Etcd 3.5 or later
- Python 3.10 or later
- PyMuPDF library
- pytesseract library
- sentence-transformers library
- watchdog library
- pymilvus client library

**Unchanged Components:**

- PostgreSQL 16
- Next.js 14
- Node.js 22

### 9.3 Human Resources

**Development Team:**

- Backend Developer: 6-8 weeks effort
- Frontend Developer: 2 weeks effort
- DevOps Engineer: 2 weeks effort

**Support During Implementation:**

- Project Manager: Part-time oversight
- QA Tester: 2 weeks effort
- End Users: UAT participation

### 9.4 Cost Considerations

**Direct Costs:**

- No licensing costs (all components open source)
- No API costs (local embedding model)
- Infrastructure costs neutral or reduced

**Indirect Costs:**

- Development team time
- Training and learning curve
- Temporary productivity impact during transition

---

## 10. Timeline and Milestones

### 10.1 Project Timeline

| Phase                           | Duration  | Start  | End    |
| ------------------------------- | --------- | ------ | ------ |
| Phase 1: Infrastructure Setup   | 2 weeks   | Week 1 | Week 2 |
| Phase 2: Document Processing    | 2 weeks   | Week 2 | Week 4 |
| Phase 3: Search API Development | 2 weeks   | Week 4 | Week 5 |
| Phase 4: Frontend Integration   | 1 week    | Week 5 | Week 6 |
| Phase 5: Data Migration         | 1 week    | Week 6 | Week 7 |
| Phase 6: Testing and Validation | 1.5 weeks | Week 7 | Week 8 |
| Phase 7: Deployment and Cutover | 1.5 weeks | Week 8 | Week 9 |

**Total Duration: 9 weeks**

### 10.2 Key Milestones

| Milestone                     | Target Date   | Success Criteria                  |
| ----------------------------- | ------------- | --------------------------------- |
| Infrastructure Ready          | End of Week 2 | Milvus operational in development |
| Processing Service Complete   | End of Week 4 | Documents indexing successfully   |
| Search API Complete           | End of Week 5 | Hybrid search functional          |
| Frontend Integration Complete | End of Week 6 | Full user workflow operational    |
| Data Migration Complete       | End of Week 7 | All documents migrated            |
| UAT Complete                  | End of Week 8 | User acceptance obtained          |
| Production Deployment         | End of Week 9 | System live in production         |

### 10.3 Dependencies and Critical Path

The critical path runs through:

1. Infrastructure Setup (prerequisite for all development)
2. Document Processing Service (required for testing search)
3. Search API Development (required for frontend integration)
4. Data Migration (required for validation)
5. Production Deployment

Parallel work is possible between frontend development and backend API development after infrastructure is ready.

---

## 11. Recommendations

### 11.1 Primary Recommendation

Based on the analysis presented in this document, the technical team recommends proceeding with the migration to Milvus with the following considerations:

**Proceed with Migration:**

- The proposed architecture offers tangible benefits in search quality and system simplification
- All current features can be replicated in the new system
- The security model remains equivalent
- Resource requirements are reduced

**Phased Approach:**

- Implement in development environment first
- Validate all features before production deployment
- Maintain rollback capability throughout

### 11.2 Alternative Options

**Option A: Full Migration (Recommended)**

- Replace Elasticsearch and FSCrawler with Milvus
- Implement all features as described
- Timeline: 9 weeks

**Option B: Hybrid Architecture**

- Keep Elasticsearch for keyword search
- Add Milvus for semantic search only
- Increased complexity but lower risk
- Timeline: 6 weeks

**Option C: Elasticsearch Vector Enhancement**

- Use Elasticsearch 8.x native vector search
- Minimal architecture changes
- Limited semantic capabilities
- Timeline: 4 weeks

### 11.3 Success Factors

For successful implementation, the following factors are critical:

1. Adequate development time allocation without competing priorities
2. Early stakeholder engagement for requirement validation
3. Comprehensive testing including search quality comparison
4. User training on any interface changes
5. Clear rollback procedures in case of issues

### 11.4 Next Steps

Upon approval of this proposal:

1. Allocate development resources as outlined
2. Set up development environment for Milvus
3. Begin Phase 1 infrastructure setup
4. Schedule regular progress reviews
5. Plan user communication regarding upcoming changes

---

## Document Approval

| Role            | Name | Signature | Date |
| --------------- | ---- | --------- | ---- |
| Technical Lead  |      |           |      |
| Project Manager |      |           |      |
| IT Director     |      |           |      |

---

**End of Document**
