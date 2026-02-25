import re

registry_file = r'c:\Users\NISHCHAL\OneDrive\Desktop\creative_suite\src\lib\toolRegistry.ts'

with open(registry_file, 'r', encoding='utf-8') as f:
    r_content = f.read()

old_converter = """  {
    id: 'pdf-converter',
    name: 'PDF to Images',
    category: 'pdf',
    description: 'Export PDF pages as PNG or JPG image files (ZIP bundle)',
    icon: FileArchive,
    status: 'ready',
    inputFormats: ['application/pdf'],
    outputFormats: ['image/png', 'image/jpeg'],
    processingEngine: 'PDF.js + Canvas (Browser)',
    features: ['PNG or JPG Output', 'All Pages Exported', 'ZIP Bundle']
  }"""
new_converter = """  {
    id: 'pdf-converter',
    name: 'File Format Changer',
    category: 'pdf',
    description: 'Convert between PDF, Word, Excel, and PowerPoint',
    icon: FileArchive,
    status: 'ready',
    inputFormats: ['.pdf', '.docx', '.xlsx', '.pptx'],
    outputFormats: ['.pdf', '.docx', '.xlsx', '.pptx'],
    processingEngine: 'Format Engine',
    features: ['PDF', 'Word', 'Excel', 'PowerPoint']
  }"""

if old_converter in r_content:
    r_content = r_content.replace(old_converter, new_converter)
    with open(registry_file, 'w', encoding='utf-8') as f:
        f.write(r_content)
    print("toolRegistry updated")
else:
    print("toolRegistry patch failed - block not found")
