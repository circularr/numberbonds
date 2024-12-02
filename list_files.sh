#!/bin/zsh

# Create output directory if it doesn't exist
mkdir -p project_files

# Remove previous output files if they exist
rm -f project_files/all_files.txt
rm -f project_files/file_list.txt

# Create header for file list
echo "=== File List ===" > project_files/file_list.txt

# Process each file
for file in $(find . -type f \
    ! -path "./node_modules/*" \
    ! -path "./dist/*" \
    ! -path "./build/*" \
    ! -path "./coverage/*" \
    ! -path "./.git/*" \
    ! -path "./project_files/*" \
    ! -name ".DS_Store" \
    ! -name "*.log" \
    ! -name "package-lock.json" \
    | sort); do
    
    # Add to file list
    echo "$file" >> project_files/file_list.txt
    
    # Add file content with header to all_files.txt
    echo "=== File: $file ===" >> project_files/all_files.txt
    echo "" >> project_files/all_files.txt
    cat "$file" >> project_files/all_files.txt
    echo "" >> project_files/all_files.txt
    echo "=== End of $file ===" >> project_files/all_files.txt
    echo "" >> project_files/all_files.txt
    echo "" >> project_files/all_files.txt
done

echo "Files have been written to project_files/all_files.txt"
echo "File list has been written to project_files/file_list.txt" 