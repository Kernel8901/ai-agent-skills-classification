# Create BASE PRP

## Feature: $ARGUMENTS

## PRP Creation Mission

Create a comprehensive PRP that enables **one-pass implementation success** through systematic research and context curation.

**Critical Understanding**: The executing AI agent only receives:

- The PRP content you create
- Its training data knowledge
- Access to codebase files (but needs guidance on which ones)

**Therefore**: Your research and context curation directly determines implementation success. Incomplete context = implementation failure.

## Research Process

- Start by invoking the codebase-analysis subagent if this is a new feature or bugfix in an existing project, then read the markdown file it produces in the PRPs/planning folder.
- When invoking the codebase analysis subagent, prompt it to research the codebase for the specific feature being implemented.

> During the research process, work through all analysis steps yourself within this session. Do NOT spawn sub-agents. The deeper research we do here the better the PRP will be. We optimize for chance of success and not for speed.

1. **Codebase Analysis in depth**
   - Search the codebase thoroughly for similar features/patterns. Think hard and plan your approach
   - Identify all the necessary files to reference in the PRP
   - Note all existing conventions to follow
   - Check existing test patterns for validation approach
   - Search broadly across the codebase for similar features and patterns

2. **External Research at scale**
   - Do deep research for similar features/patterns online and include urls to documentation and examples
   - Library documentation (include specific URLs)
   - For critical pieces of documentation add a .md file to PRPs/ai_docs and reference it in the PRP with clear reasoning and instructions
   - Implementation examples (GitHub/StackOverflow/blogs)
   - Best practices and common pitfalls found during research
   - Search broadly for similar features/patterns online and include urls to documentation and examples

   ### Research Tools (USE THESE)

   When researching, leverage ALL available tools:

   | Tool | Best For | Example |
   |------|----------|---------|
   | **Web Search** | General web queries, docs, tutorials | "Next.js 14 app router patterns" |
   | **GitHub CLI** | Find repos, code examples, issues | `gh search repos "wagmi bonding curve"` |
   | **GitHub CLI** | View specific repos | `gh repo view owner/repo --json description,readme` |
   | **GitHub CLI** | Search code patterns | `gh search code "pattern" --repo owner/repo` |

   **Priority:** GitHub CLI for code > Web search for concepts > Web fetch for specific URLs

3. **User Clarification**
   - Ask for clarification if you need it

## PRP Generation Process

### Step 1: Choose Template

Use the PRP template (`prp_base.md`) as your template structure - it contains all necessary sections and formatting.

### Step 2: Context Completeness Validation

Before writing, apply the **"No Prior Knowledge" test** from the template:
_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

### Step 3: Research Integration

Transform your research findings into the template sections:

**Goal Section**: Use research to define specific, measurable Feature Goal and concrete Deliverable
**Context Section**: Populate YAML structure with your research findings - specific URLs, file patterns, gotchas
**Implementation Tasks**: Create dependency-ordered tasks using information-dense keywords from codebase analysis
**Validation Gates**: Use project-specific validation commands that you've verified work in this codebase

### Step 4: Information Density Standards

Ensure every reference is **specific and actionable**:

- URLs include section anchors, not just domain names
- File references include specific patterns to follow, not generic mentions
- Task specifications include exact naming conventions and placement
- Validation commands are project-specific and executable

### Step 5: ULTRATHINK Before Writing

After research completion, create a comprehensive PRP writing plan:

- Plan how to structure each template section with your research findings
- Identify gaps that need additional research
- Create systematic approach to filling template with actionable context

## Output

Save as: `PRPs/{feature-name}.md` (avoid calling it INITIAL.md)

## PRP Quality Gates

### Context Completeness Check

- [ ] Passes "No Prior Knowledge" test from template
- [ ] All YAML references are specific and accessible
- [ ] Implementation tasks include exact naming and placement guidance
- [ ] Validation commands are project-specific and verified working

### Template Structure Compliance

- [ ] All required template sections completed
- [ ] Goal section has specific Feature Goal, Deliverable, Success Definition
- [ ] Implementation Tasks follow dependency ordering
- [ ] Final Validation Checklist is comprehensive

### Information Density Standards

- [ ] No generic references - all are specific and actionable
- [ ] File patterns point at specific examples to follow
- [ ] URLs include section anchors for exact guidance
- [ ] Task specifications use information-dense keywords from codebase

## Success Metrics

**Confidence Score**: Rate 1-10 for one-pass implementation success likelihood

**Validation**: The completed PRP should enable an AI agent unfamiliar with the codebase to implement the feature successfully using only the PRP content and codebase access.
