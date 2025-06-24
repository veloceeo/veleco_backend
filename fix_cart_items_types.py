#!/usr/bin/env python3
"""
Script to fix TypeScript return type issues in cart_items.ts
Converts all "return res.status().json()" to "res.status().json(); return;"
"""

import re

def fix_typescript_returns(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match return statements with res.status().json()
    pattern = r'return res\.status\([^)]+\)\.json\([^;]+\);'
    
    def replace_return(match):
        original = match.group(0)
        # Remove 'return ' from the beginning and add '; return;' at the end
        fixed = original.replace('return ', '') + '\n            return;'
        return fixed.replace(';', '', 1)  # Remove the first semicolon and add it back properly
    
    # Apply the replacement
    fixed_content = re.sub(pattern, replace_return, content)
    
    # Also fix the function signatures to add Promise<void>
    fixed_content = re.sub(
        r'(cart_items\.[a-z]+\([^,]+, authMiddleware, async \(req, res\)): => {',
        r'\1: Promise<void> => {',
        fixed_content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print(f"Fixed TypeScript return types in {file_path}")

if __name__ == "__main__":
    fix_typescript_returns(r"k:\Intern\E_Commerce\models\cart_items.ts")
