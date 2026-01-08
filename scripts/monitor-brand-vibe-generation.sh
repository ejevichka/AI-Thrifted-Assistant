#!/bin/bash

# Monitor brand-vibe-matrix generation progress

LOG_FILE="scripts/brand-vibe-generation.log"
OUTPUT_FILE="data/vinted/brand-vibe-matrix.json"

echo "=== BRAND-VIBE-MATRIX GENERATION MONITOR ==="
echo ""

# Check if log exists
if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found: $LOG_FILE"
    exit 1
fi

# Get current progress
CURRENT=$(grep -oE '\[[0-9]+/934\]' "$LOG_FILE" | tail -1 | grep -oE '[0-9]+' | head -1)
TOTAL=934

if [ -z "$CURRENT" ]; then
    CURRENT=0
fi

PERCENTAGE=$((CURRENT * 100 / TOTAL))

echo "📊 Progress: $CURRENT / $TOTAL brands ($PERCENTAGE%)"
echo ""

# Calculate remaining time (estimate)
if [ "$CURRENT" -gt 0 ]; then
    # Get timestamp of first brand
    FIRST_TIME=$(grep '\[1/934\]' "$LOG_FILE" -A 1 | tail -1 | grep -oE '[0-9]{2}:[0-9]{2}:[0-9]{2}')

    # Get current time from log
    CURRENT_TIME=$(grep "\[$CURRENT/934\]" "$LOG_FILE" -A 1 | tail -1 | grep -oE '[0-9]{2}:[0-9]{2}:[0-9]{2}')

    REMAINING=$((TOTAL - CURRENT))
    AVG_TIME_PER_BRAND=$(($(date +%s) / CURRENT))
    EST_REMAINING_SEC=$((REMAINING * 2))
    EST_REMAINING_MIN=$((EST_REMAINING_SEC / 60))

    echo "⏱️  Estimated time remaining: ~$EST_REMAINING_MIN minutes"
    echo ""
fi

# Show last 5 processed brands
echo "📝 Last 5 processed brands:"
grep -E '\[[0-9]+/934\] Processing:' "$LOG_FILE" | tail -5 | sed 's/Processing: /  ✓ /'
echo ""

# Count successes and failures
SUCCESS=$(grep -c '✅ Success!' "$LOG_FILE")
FAILED=$(grep -c '⚠️  Failed' "$LOG_FILE")

echo "✅ Successes: $SUCCESS"
echo "❌ Failed: $FAILED"
echo ""

# Check if complete
if [ "$CURRENT" -eq "$TOTAL" ]; then
    echo "🎉 GENERATION COMPLETE!"

    if [ -f "$OUTPUT_FILE" ]; then
        BRANDS_IN_FILE=$(jq 'keys | length' "$OUTPUT_FILE" 2>/dev/null)
        echo "💾 Output file: $OUTPUT_FILE"
        echo "📦 Brands in matrix: $BRANDS_IN_FILE"
    fi
else
    echo "⏳ Generation in progress..."
    echo "   Process ID: $(pgrep -f 'generate-brand-vibe-matrix.ts' | head -1)"
fi

echo ""
echo "=== END MONITOR ==="
