# Execute BASE PRP

## PRP File: $ARGUMENTS

## Mission: One-Pass Implementation Success

PRPs enable working code on the first attempt through:

- **Context Completeness**: Everything needed, nothing guessed
- **Progressive Validation**: 4-level gates catch errors early
- **Pattern Consistency**: Follow existing codebase approaches

**Your Goal**: Transform the PRP into working code that passes all validation gates.

## Execution Process

1. **Load PRP**
   - Read the specified PRP file completely
   - Absorb all context, patterns, requirements and gather codebase intelligence
   - Use the provided documentation references and file patterns, consume the right documentation before the appropriate task
   - Trust the PRP's context and guidance - it's designed for one-pass success
   - If needed do additional codebase exploration and research as needed

   ### Research Tools (If Stuck or Need More Context)

   When you need additional research, leverage ALL available tools:

   | Tool | Best For | Example |
   |------|----------|---------|
   | **Web Search** | General web queries, docs, tutorials | "Next.js 14 app router patterns" |
   | **GitHub CLI** | Find repos, code examples, issues | `gh search repos "wagmi bonding curve"` |
   | **GitHub CLI** | View specific repos | `gh repo view owner/repo --json description,readme` |
   | **GitHub CLI** | Search code patterns | `gh search code "pattern" --repo owner/repo` |

   **Priority:** GitHub CLI for code > Web search for concepts > Web fetch for specific URLs

2. **ULTRATHINK & Plan**
   - Create comprehensive implementation plan following the PRP's task order
   - Break down into clear tasks and track progress as you work through each one
   - Follow the patterns referenced in the PRP
   - Use specific file paths, class names, and method signatures from PRP context
   - Never guess - always verify the codebase patterns and examples referenced in the PRP yourself

3. **Execute Implementation**
   - Follow the PRP's Implementation Tasks sequence, add more detail as needed, especially when using subagents
   - Use the patterns and examples referenced in the PRP
   - Create files in locations specified by the desired codebase tree
   - Apply naming conventions from the task specifications and CLAUDE.md

4. **Progressive Validation**

   **Execute the level validation system from the PRP:**
   - **Level 1**: Run syntax & style validation commands from PRP
   - **Level 2**: Execute unit test validation from PRP
   - **Level 3**: Run integration testing commands from PRP
   - **Level 4**: Execute specified validation from PRP

   **Each level must pass before proceeding to the next.**

5. **Completion Verification**
   - Work through the Final Validation Checklist in the PRP
   - Verify all Success Criteria from the "What" section are met
   - Confirm all Anti-Patterns were avoided
   - Implementation is ready and working

**Failure Protocol**: When validation fails, use the patterns and gotchas from the PRP to fix issues, then re-run validation until passing.
