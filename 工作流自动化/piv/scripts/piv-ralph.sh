#!/bin/bash
#
# PIV Ralph - Multi-Phase Overnight Automation
#
# Executes PIV (Plan-Implement-Validate) workflow across multiple phases,
# with each phase running in a separate Claude context for clean implementation.
#
# Usage:
#   piv-ralph.sh [PROJECT_PATH] [START_PHASE] [END_PHASE]
#
# Example:
#   piv-ralph.sh /path/to/my/project 1 4
#
# Each phase:
#   1. Generates PRP if missing (separate Claude context)
#   2. Executes PRP (separate Claude context)
#   3. Updates WORKFLOW.md progress
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Usage
usage() {
    echo "PIV Ralph - Multi-Phase Automation"
    echo ""
    echo "Usage: $0 [PROJECT_PATH] [START_PHASE] [END_PHASE]"
    echo ""
    echo "Arguments:"
    echo "  PROJECT_PATH   Absolute path to project directory"
    echo "  START_PHASE    First phase number to execute (e.g., 1)"
    echo "  END_PHASE      Last phase number to execute (e.g., 4)"
    echo ""
    echo "Each phase runs in a separate Claude context for clean implementation."
    exit 1
}

# Check arguments
if [ $# -lt 3 ]; then
    usage
fi

PROJECT_PATH="$1"
START_PHASE="$2"
END_PHASE="$3"

# Validate project path
if [ ! -d "$PROJECT_PATH" ]; then
    log_error "Project directory not found: $PROJECT_PATH"
    exit 1
fi

# Validate phase numbers
if ! [[ "$START_PHASE" =~ ^[0-9]+$ ]] || ! [[ "$END_PHASE" =~ ^[0-9]+$ ]]; then
    log_error "Phase numbers must be integers"
    exit 1
fi

if [ "$START_PHASE" -gt "$END_PHASE" ]; then
    log_error "START_PHASE must be <= END_PHASE"
    exit 1
fi

# Check for PRDs directory
if [ ! -d "$PROJECT_PATH/PRDs" ]; then
    log_error "No PRDs directory found in $PROJECT_PATH"
    exit 1
fi

# Create PRPs directory if needed
mkdir -p "$PROJECT_PATH/PRPs"

# Log file for this run
LOG_FILE="$PROJECT_PATH/PRPs/piv-ralph-$(date +%Y%m%d-%H%M%S).log"
log_info "Logging to: $LOG_FILE"

# Function to check if PRP exists for a phase
check_prp_exists() {
    local phase=$1
    # Look for various PRP naming patterns
    local patterns=(
        "$PROJECT_PATH/PRPs/*-phase-${phase}.md"
        "$PROJECT_PATH/PRPs/*-p${phase}.md"
        "$PROJECT_PATH/PRPs/*-P${phase}.md"
    )

    for pattern in "${patterns[@]}"; do
        if compgen -G "$pattern" > /dev/null 2>&1; then
            # Return the first match
            echo "$(compgen -G "$pattern" | head -1)"
            return 0
        fi
    done

    return 1
}

# Function to generate PRP for a phase
generate_prp() {
    local phase=$1
    log_info "Generating PRP for Phase $phase..."

    # Run Claude to generate PRP
    # The -p flag runs in non-interactive mode
    claude -p "
You are working on project at: $PROJECT_PATH

Task: Generate a PRP (Project Requirement Protocol) for Phase $phase.

Steps:
1. Read the PRD files in $PROJECT_PATH/PRDs/
2. Identify Phase $phase requirements
3. Create a detailed PRP file at $PROJECT_PATH/PRPs/PRP-phase-${phase}.md

The PRP should include:
- Clear scope (Phase $phase only)
- Implementation steps with code examples
- File modifications needed
- Test criteria
- Validation checklist
- Dependencies on other phases

Write the PRP file, then output: PHASE_${phase}_PRP_GENERATED
" 2>&1 | tee -a "$LOG_FILE"

    log_success "PRP generation for Phase $phase completed"
}

# Function to execute PRP for a phase
execute_prp() {
    local phase=$1
    local prp_file=$2
    log_info "Executing PRP for Phase $phase: $prp_file"

    # Run Claude to execute PRP
    claude -p "
You are working on project at: $PROJECT_PATH

Task: Execute the PRP (Project Requirement Protocol) for Phase $phase.

PRP File: $prp_file

Steps:
1. Read the PRP file thoroughly
2. Implement each requirement in order
3. Run tests to validate
4. Update WORKFLOW.md with progress

Execute the implementation, then output: PHASE_${phase}_EXECUTED
" 2>&1 | tee -a "$LOG_FILE"

    log_success "PRP execution for Phase $phase completed"
}

# Function to update WORKFLOW.md
update_workflow() {
    local phase=$1
    local status=$2

    if [ -f "$PROJECT_PATH/WORKFLOW.md" ]; then
        log_info "Updating WORKFLOW.md for Phase $phase: $status"
        # Simple append - Claude should handle proper updates
        echo "" >> "$PROJECT_PATH/WORKFLOW.md"
        echo "## Phase $phase - $status ($(date +%Y-%m-%d))" >> "$PROJECT_PATH/WORKFLOW.md"
    fi
}

# Main execution loop
log_info "============================================"
log_info "PIV Ralph - Multi-Phase Automation"
log_info "============================================"
log_info "Project: $PROJECT_PATH"
log_info "Phases: $START_PHASE to $END_PHASE"
log_info "Started: $(date)"
log_info "============================================"

for ((phase=START_PHASE; phase<=END_PHASE; phase++)); do
    log_info ""
    log_info "============================================"
    log_info "PHASE $phase"
    log_info "============================================"

    # Check if PRP exists
    prp_file=$(check_prp_exists $phase) || true

    if [ -z "$prp_file" ]; then
        log_warn "No PRP found for Phase $phase"

        # Generate PRP (separate Claude context)
        generate_prp $phase

        # Wait a moment for file system
        sleep 2

        # Check again for PRP
        prp_file=$(check_prp_exists $phase) || true

        if [ -z "$prp_file" ]; then
            log_error "PRP generation failed for Phase $phase"
            log_error "Check logs at: $LOG_FILE"
            exit 1
        fi

        log_success "PRP generated: $prp_file"
    else
        log_info "PRP already exists: $prp_file"
    fi

    # Execute PRP (separate Claude context)
    execute_prp $phase "$prp_file"

    # Update workflow
    update_workflow $phase "COMPLETED"

    log_success "Phase $phase completed!"

    # Brief pause between phases
    if [ $phase -lt $END_PHASE ]; then
        log_info "Pausing before next phase..."
        sleep 5
    fi
done

log_info ""
log_info "============================================"
log_info "PIV Ralph Complete!"
log_info "============================================"
log_info "Phases completed: $START_PHASE to $END_PHASE"
log_info "Finished: $(date)"
log_info "Log file: $LOG_FILE"
log_info "============================================"

exit 0
