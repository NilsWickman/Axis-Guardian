#!/usr/bin/env python3
"""
Split the group SVG into individual person SVG files with proper formatting.
Creates clean, valid SVG files that can be edited in browser tools.
Uses XML parsing to preserve complete element hierarchies.
"""

import xml.etree.ElementTree as ET
from pathlib import Path
import re

# Read the input SVG
input_file = Path(__file__).parent / "vecteezy_group-of-people-different-genders-different-ages-standing_25668856.svg"
output_dir = Path(__file__).parent

print("Reading input SVG...")
with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Parse with ElementTree
# Register namespaces to avoid ns0: prefixes
ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

tree = ET.parse(input_file)
root = tree.getroot()

# Get viewBox
viewBox = root.get('viewBox', '0 0 5000 2500')
_, _, width, height = map(float, viewBox.split())

# Calculate sections for 5 people (equal width)
section_width = width / 5  # 1000 pixels per person
padding = 100  # Padding for viewBox to show complete person

def get_element_bounds(element):
    """Extract x-coordinate bounds from an element and its children"""
    min_x = float('inf')
    max_x = float('-inf')

    def extract_coords(elem):
        nonlocal min_x, max_x

        # Check various attributes that might contain x coordinates
        for attr in ['x', 'cx', 'x1', 'x2']:
            if attr in elem.attrib:
                try:
                    x = float(elem.attrib[attr])
                    min_x = min(min_x, x)
                    max_x = max(max_x, x)
                except ValueError:
                    pass

        # Check transform attribute
        if 'transform' in elem.attrib:
            transform = elem.attrib['transform']
            # Extract translate values
            translate_match = re.search(r'translate\(([-+]?\d+\.?\d*)[,\s]+([-+]?\d+\.?\d*)\)', transform)
            if translate_match:
                x = float(translate_match.group(1))
                min_x = min(min_x, x)
                max_x = max(max_x, x)

        # Check d attribute (path data)
        if 'd' in elem.attrib:
            d = elem.attrib['d']
            # Extract all numbers that could be x-coordinates
            numbers = re.findall(r'[-+]?\d+\.?\d*', d)
            for i in range(0, len(numbers), 2):  # Every other number is potentially an x-coordinate
                try:
                    x = float(numbers[i])
                    min_x = min(min_x, x)
                    max_x = max(max_x, x)
                except (ValueError, IndexError):
                    pass

        # Check points attribute (polygon/polyline)
        if 'points' in elem.attrib:
            points = elem.attrib['points']
            coords = re.findall(r'[-+]?\d+\.?\d*', points)
            for i in range(0, len(coords), 2):
                try:
                    x = float(coords[i])
                    min_x = min(min_x, x)
                    max_x = max(max_x, x)
                except (ValueError, IndexError):
                    pass

        # Recursively check children
        for child in elem:
            extract_coords(child)

    extract_coords(element)

    if min_x == float('inf'):
        return None, None
    return min_x, max_x

def get_best_section_for_element(element, section_width, num_sections):
    """Determine which section has the most overlap with this element"""
    min_x, max_x = get_element_bounds(element)

    if min_x is None or max_x is None:
        return None

    element_width = max_x - min_x
    if element_width == 0:
        # Point element, use which section contains it
        return int(min(max(min_x, 0), section_width * num_sections - 1) / section_width)

    # Find section with maximum overlap
    best_section = 0
    max_overlap = 0

    for i in range(num_sections):
        start_x = i * section_width
        end_x = (i + 1) * section_width

        overlap_start = max(min_x, start_x)
        overlap_end = min(max_x, end_x)
        overlap_width = max(0, overlap_end - overlap_start)

        if overlap_width > max_overlap:
            max_overlap = overlap_width
            best_section = i

    return best_section

def element_in_section(element, section_num, section_width, num_sections):
    """Check if this element belongs to this section"""
    best_section = get_best_section_for_element(element, section_width, num_sections)
    return best_section == section_num if best_section is not None else True

# Get namespace
ns = {'svg': 'http://www.w3.org/2000/svg', 'xlink': 'http://www.w3.org/1999/xlink'}

# Split into 5 people
for person_num in range(5):
    start_x = person_num * section_width
    end_x = (person_num + 1) * section_width

    output_file = output_dir / f"person_{person_num + 1}.svg"

    print(f"Creating {output_file.name} (x: {start_x:.0f}-{end_x:.0f})")

    # Calculate viewBox for this person
    # Add left padding only for first person, right padding only for last person
    if person_num == 0:
        # First person: padding on left and right
        viewBox_x = 0
        viewBox_width = min(section_width + padding, width)
    elif person_num == 4:
        # Last person: padding on right
        viewBox_x = start_x
        viewBox_width = min(section_width + padding, width - start_x)
    else:
        # Middle persons: no padding to avoid showing adjacent people
        viewBox_x = start_x
        viewBox_width = section_width

    # Create new SVG root
    new_root = ET.Element('{http://www.w3.org/2000/svg}svg')
    # Namespace declarations are handled automatically by ET.register_namespace
    new_root.set('width', f"{viewBox_width:.0f}")
    new_root.set('height', f"{height:.0f}")
    new_root.set('viewBox', f"{viewBox_x:.0f} 0 {viewBox_width:.0f} {height:.0f}")

    # Copy defs if present
    for defs in root.findall('{http://www.w3.org/2000/svg}defs'):
        new_root.append(defs)

    # Filter and copy top-level elements
    added_count = 0
    for child in root:
        # Skip defs (already copied) and metadata
        tag_name = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag_name in ['defs', 'metadata', 'title', 'desc']:
            continue

        # Check if this element should be included
        if element_in_section(child, person_num, section_width, 5):
            new_root.append(child)
            added_count += 1

    # Create tree and write with pretty formatting
    new_tree = ET.ElementTree(new_root)

    # Write to file
    with open(output_file, 'wb') as f:
        f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
        new_tree.write(f, encoding='utf-8', xml_declaration=False)

    print(f"  Added {added_count} elements")

print("\nSplitting complete!")
print("\nValidating generated files...")

# Quick validation
for i in range(1, 6):
    file_path = output_dir / f"person_{i}.svg"
    with open(file_path, 'r') as f:
        content = f.read()
        # Check for proper SVG structure
        has_svg_tag = '<svg' in content and '</svg>' in content
        has_xml_decl = '<?xml' in content
        has_closing = content.strip().endswith('</svg>')

        # Try to parse to validate XML structure
        try:
            ET.parse(file_path)
            parse_valid = True
        except ET.ParseError as e:
            parse_valid = False
            print(f"  Parse error: {e}")

        status = "✓" if (has_svg_tag and has_xml_decl and has_closing and parse_valid) else "✗"
        print(f"{status} person_{i}.svg - {len(content)} bytes")

print("\nDone! SVG files should now be editable in browser tools.")
