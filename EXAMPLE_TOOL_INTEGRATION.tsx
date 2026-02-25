'use client';

/**
 * EXAMPLE: Complete Tool Integration
 * 
 * This file demonstrates how to integrate a tool processor
 * with the Universal Workspace including custom options UI.
 * 
 * Copy this pattern for implementing new tools.
 */

import React from 'react';
import UniversalWorkspace from '@/components/UniversalWorkspace';
import { getToolById } from '@/lib/toolRegistry';
import { ProcessingOptions } from '@/lib/toolRegistry';
import { imageCompressorProcessor } from '@/processors/imagecompressor';

export default function ImageCompressorPage() {
  const tool = getToolById('img-compressor');

  if (!tool) {
    return <div>Tool not found</div>;
  }

  // Custom options UI renderer
  const renderOptions = (
    options: ProcessingOptions,
    setOptions: (options: ProcessingOptions) => void
  ) => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quality: {options.quality}%
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={options.quality || 85}
            onChange={(e) =>
              setOptions({ ...options, quality: parseInt(e.target.value) })
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Lower size</span>
            <span>Higher quality</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Width (px)
          </label>
          <input
            type="number"
            value={options.maxWidth || 1920}
            onChange={(e) =>
              setOptions({ ...options, maxWidth: parseInt(e.target.value) })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1920"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Height (px)
          </label>
          <input
            type="number"
            value={options.maxHeight || 1920}
            onChange={(e) =>
              setOptions({ ...options, maxHeight: parseInt(e.target.value) })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1920"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output Format
          </label>
          <select
            value={options.format || 'image/jpeg'}
            onChange={(e) => setOptions({ ...options, format: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            💡 Tip: Use WebP for the best compression. JPEG for photos, PNG for
            graphics with transparency.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <UniversalWorkspace
        tool={tool}
        onProcess={imageCompressorProcessor.process}
        renderOptions={renderOptions}
        defaultOptions={imageCompressorProcessor.getDefaultOptions?.()}
      />
    </div>
  );
}

/**
 * PATTERN NOTES:
 * 
 * 1. Get tool metadata from registry
 * 2. Import the corresponding processor
 * 3. (Optional) Create custom options UI with renderOptions
 * 4. Pass everything to UniversalWorkspace
 * 
 * The workspace handles:
 * - File upload
 * - Validation
 * - Processing
 * - Preview
 * - Download
 * - Error handling
 * 
 * You only need to implement the processing logic!
 */
