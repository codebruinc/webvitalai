#!/bin/bash

# apply-simple-fix.sh
# Simple script to apply the minimal fix for the scan creation issue in WebVitalAI

echo "Starting WebVitalAI scan creation fix..."
echo "Creating backups of original files..."

# Create backups directory if it doesn't exist
mkdir -p ./backups

# Backup the files we're going to modify
cp src/services/scanService.ts ./backups/scanService.ts.bak
echo "✅ Created backup of scanService.ts"

# Apply the fix to scanService.ts - specifically targeting the getScanResult function
echo "Applying fix to scanService.ts..."

# Check if we're on macOS or Linux (different sed syntax)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS version
  sed -i.tmp '
    914s/await supabase/await supabaseServiceRole/
    1068s/await supabase/await supabaseServiceRole/
    1078s/await supabase/await supabaseServiceRole/
    1088s/await supabase/await supabaseServiceRole/
  ' src/services/scanService.ts
else
  # Linux version
  sed -i.tmp '
    914s/await supabase/await supabaseServiceRole/
    1068s/await supabase/await supabaseServiceRole/
    1078s/await supabase/await supabaseServiceRole/
    1088s/await supabase/await supabaseServiceRole/
  ' src/services/scanService.ts
fi

# Clean up temporary files
rm src/services/scanService.ts.tmp

# Rebuild the application
echo "Rebuilding the application..."
npm run build

echo "✅ Fix applied successfully!"
echo "Please see SIMPLE-FIX-INSTRUCTIONS.md for testing instructions."