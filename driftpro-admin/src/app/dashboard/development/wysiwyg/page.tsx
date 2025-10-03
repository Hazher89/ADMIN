'use client';

import React, { useEffect, useRef, useState } from 'react';
import GrapesJS from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import gjsPluginForms from 'grapesjs-plugin-forms';
import gjsPluginExport from 'grapesjs-plugin-export';
import {
  Save, Download, Upload, Eye, Code, Settings, Layers, Smartphone, Tablet, Monitor, 
  Undo, Redo, Play, Trash2, Plus, Minus as MinusIcon, FolderOpen, FileText, Image as ImageIcon, 
  Grid, Palette, Type, Square, Circle, Layout, List, Table, Globe, Database, 
  Zap, Lock, Unlock, Copy, Scissors, Move, RotateCw, RotateCcw, FlipHorizontal, 
  FlipVertical, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, 
  Underline, Strikethrough, Link, List as ListIcon, Indent, Outdent, Quote, X, Maximize
} from 'lucide-react';

export default function WYSIWYGEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const templates = [
    {
      id: 'landing',
      name: 'Landing Page',
      description: 'Modern landing page with hero section',
      content: `
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">Welcome to DriftPro</h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Build amazing websites with our advanced WYSIWYG editor</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">Get Started</button>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'dashboard',
      name: 'Dashboard Layout',
      description: 'Clean dashboard with sidebar and content area',
      content: `
        <div className="flex min-h-screen bg-gray-100">
          <div className="w-64 bg-white shadow-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
            </div>
            <nav className="mt-6">
              <a href="#" className="block px-6 py-3 text-gray-600 hover:bg-gray-50">Overview</a>
              <a href="#" className="block px-6 py-3 text-gray-600 hover:bg-gray-50">Analytics</a>
              <a href="#" className="block px-6 py-3 text-gray-600 hover:bg-gray-50">Reports</a>
            </nav>
          </div>
          <div className="flex-1 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Main Content Area</h1>
            <p className="text-gray-700">This is where your dashboard content goes.</p>
          </div>
        </div>
      `
    },
    {
      id: 'card',
      name: 'Card Layout',
      description: 'Simple card-based layout',
      content: `
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Card Title</h3>
                <p className="text-gray-600">This is a simple card layout with clean design.</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Card Title</h3>
                <p className="text-gray-600">This is a simple card layout with clean design.</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Card Title</h3>
                <p className="text-gray-600">This is a simple card layout with clean design.</p>
              </div>
            </div>
          </div>
        </div>
      `
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'd':
            e.preventDefault();
            duplicateComponent();
            break;
          case 's':
            e.preventDefault();
            exportZIP();
            break;
          case 'e':
            e.preventDefault();
            exportHTML();
            break;
          case 'p':
            e.preventDefault();
            setShowPreview(true);
            break;
          case 't':
            e.preventDefault();
            setShowTemplates(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  useEffect(() => {
    async function initEditor() {
      if (editorRef.current && !editor) {
        const GrapesJS = (await import('grapesjs')).default;

               // Add custom CSS to reduce icon sizes and remove brown backgrounds
               const style = document.createElement('style');
               style.textContent = `
                 /* Remove all brown backgrounds from GrapesJS */
                 .gjs-pn-panel {
                   background: var(--white) !important;
                   border-color: var(--gray-200) !important;
                 }
                 .gjs-blocks-cs {
                   background: var(--white) !important;
                   padding: 8px !important;
                 }
                 .gjs-category {
                   background: var(--white) !important;
                 }
                 .gjs-category .gjs-category-title {
                   background: var(--gray-50) !important;
                   color: var(--gray-700) !important;
                   font-size: 11px !important;
                   padding: 6px 10px !important;
                 }
                 .gjs-block {
                   background: var(--white) !important;
                   border: 1px solid var(--gray-200) !important;
                   color: var(--gray-700) !important;
                   width: 80px !important;
                   height: 50px !important;
                   margin: 3px !important;
                   padding: 8px !important;
                 }
                 .gjs-block:hover {
                   background: var(--gray-50) !important;
                   border-color: var(--gray-300) !important;
                 }
                 .gjs-block svg {
                   width: 16px !important;
                   height: 16px !important;
                   color: var(--gray-600) !important;
                 }
                 .gjs-block i {
                   font-size: 16px !important;
                   color: var(--gray-600) !important;
                 }
                 .gjs-block-label {
                   font-size: 10px !important;
                   margin-top: 3px !important;
                   color: var(--gray-600) !important;
                 }
                 .gjs-layer-item svg {
                   width: 14px !important;
                   height: 14px !important;
                 }
                 .gjs-layer-item i {
                   font-size: 14px !important;
                 }
                 .gjs-toolbar svg {
                   width: 14px !important;
                   height: 14px !important;
                 }
                 .gjs-toolbar i {
                   font-size: 14px !important;
                 }
                 .gjs-pn-btn svg {
                   width: 14px !important;
                   height: 14px !important;
                 }
                 .gjs-pn-btn i {
                   font-size: 14px !important;
                 }
                 .gjs-sm-sector .gjs-sm-property svg {
                   width: 12px !important;
                   height: 12px !important;
                 }
                 .gjs-sm-sector .gjs-sm-property i {
                   font-size: 12px !important;
                 }
                 /* Style Manager */
                 .gjs-sm-sectors {
                   background: var(--white) !important;
                 }
                 .gjs-sm-sector {
                   background: var(--white) !important;
                   border-color: var(--gray-200) !important;
                 }
                 .gjs-sm-sector .gjs-sm-title {
                   background: var(--gray-50) !important;
                   color: var(--gray-700) !important;
                 }
                 /* Canvas */
                 .gjs-cv-canvas {
                   background: var(--white) !important;
                 }
                 /* Remove any remaining brown/dark backgrounds */
                 .gjs-frame {
                   background: var(--white) !important;
                 }
                 .gjs-editor {
                   background: var(--background-color) !important;
                 }
                 /* Force remove all dark/brown colors */
                 .gjs-pn-panel,
                 .gjs-pn-panel * {
                   background: var(--white) !important;
                   color: var(--gray-700) !important;
                 }
                 .gjs-pn-panel .gjs-pn-btn {
                   background: var(--white) !important;
                   color: var(--gray-600) !important;
                   border: 1px solid var(--gray-200) !important;
                 }
                 .gjs-pn-panel .gjs-pn-btn:hover {
                   background: var(--gray-50) !important;
                   color: var(--gray-800) !important;
                 }
                 /* Layer Manager */
                 .gjs-layers {
                   background: var(--white) !important;
                 }
                 .gjs-layer-item {
                   background: var(--white) !important;
                   color: var(--gray-700) !important;
                   border-color: var(--gray-200) !important;
                 }
                 .gjs-layer-item:hover {
                   background: var(--gray-50) !important;
                 }
                 /* Trait Manager */
                 .gjs-trt-trait {
                   background: var(--white) !important;
                   color: var(--gray-700) !important;
                   border-color: var(--gray-200) !important;
                 }
                 /* Device Manager */
                 .gjs-devices-c {
                   background: var(--white) !important;
                 }
                 .gjs-device {
                   background: var(--white) !important;
                   color: var(--gray-700) !important;
                   border-color: var(--gray-200) !important;
                 }
                 .gjs-device:hover {
                   background: var(--gray-50) !important;
                 }
               `;
        document.head.appendChild(style);

        const newEditor = GrapesJS.init({
          container: editorRef.current,
          fromElement: true,
          height: '100%',
          width: 'auto',
          storageManager: {
            id: 'gjs-',
            type: 'local',
            autosave: true,
            autoload: true,
            stepsBeforeSave: 1,
            storeComponents: true,
            storeStyles: true,
            storeHtml: true,
            storeCss: true,
          },
          undoManager: {
            trackSelection: true,
          },
          selectorManager: {
            appendTo: '.styles-container',
          },
          deviceManager: {
            devices: [
              {
                id: 'desktop',
                name: 'Desktop',
                width: '',
              },
              {
                id: 'tablet',
                name: 'Tablet',
                width: '768px',
                widthMedia: '992px',
              },
              {
                id: 'mobile',
                name: 'Mobile',
                width: '375px',
                widthMedia: '480px',
              },
            ],
          },
          plugins: [
            gjsPresetWebpage,
            gjsBlocksBasic,
            gjsPluginForms,
            gjsPluginExport,
          ],
          pluginsOpts: {
            gjsPresetWebpage: {
              modalImportTitle: 'Import Template',
              modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">Paste here your HTML/CSS and click Import</div>',
              modalImportContent: function(editor: any) {
                return editor.getHtml() + '<style>' + editor.getCss() + '</style>';
              },
            },
            gjsBlocksBasic: {
              blocks: ['column1', 'column2', 'column3', 'column3-7', 'text', 'link', 'image', 'video'],
              flexGrid: 1,
            },
            gjsPluginForms: {
              blocks: ['form', 'input', 'textarea', 'select', 'button', 'label', 'checkbox', 'radio'],
            },
            gjsPluginExport: {
              btnLabel: 'Export',
            }
          },
          blockManager: {
            appendTo: '.blocks-container',
            blocks: [
              {
                id: 'section',
                label: 'Section',
                category: 'Layout',
                attributes: { className: 'gjs-block-section' },
                content: '<section className="py-8 px-4"><div className="container mx-auto">Section</div></section>',
              },
              {
                id: 'container',
                label: 'Container',
                category: 'Layout',
                attributes: { className: 'gjs-block-container' },
                content: '<div className="container mx-auto px-4">Container</div>',
              },
              {
                id: 'grid-row',
                label: 'Row',
                category: 'Layout',
                attributes: { className: 'gjs-block-row' },
                content: '<div className="flex flex-wrap -mx-4"></div>',
              },
              {
                id: 'grid-column',
                label: 'Column',
                category: 'Layout',
                attributes: { className: 'gjs-block-column' },
                content: '<div className="w-full md:w-1/2 lg:w-1/3 px-4">Column</div>',
              },
              {
                id: 'text-section',
                label: 'Text Section',
                category: 'Text',
                content: '<div className="text-center py-8"><h1 className="text-4xl font-bold mb-4">Title</h1><p className="text-lg">Lorem ipsum dolor sit amet.</p></div>',
              },
              {
                id: 'image-block',
                label: 'Image',
                category: 'Media',
                content: { type: 'image' },
                attributes: { className: 'gjs-block-image' },
              },
              {
                id: 'button-block',
                label: 'Button',
                category: 'Buttons',
                content: '<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Button</button>',
              },
              {
                id: 'card-block',
                label: 'Card',
                category: 'Components',
                content: `
                  <div className="max-w-sm rounded overflow-hidden shadow-lg p-4">
                    <img className="w-full" src="/api/placeholder/300/200" alt="Card image" />
                    <div className="px-6 py-4">
                      <div className="font-bold text-xl mb-2">Card Title</div>
                      <p className="text-gray-700 text-base">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                      </p>
                    </div>
                    <div className="px-6 pt-4 pb-2">
                      <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#tag1</span>
                      <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#tag2</span>
                    </div>
                  </div>
                `,
              },
            ],
          },
          layerManager: {
            appendTo: '.layers-container'
          },
          styleManager: {
            appendTo: '.styles-container',
            sectors: [
              {
                name: 'General',
                open: false,
                buildProps: ['float', 'display', 'position', 'top', 'right', 'left', 'bottom']
              },
              {
                name: 'Dimension',
                open: false,
                buildProps: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding']
              },
              {
                name: 'Typography',
                open: false,
                buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-shadow']
              },
              {
                name: 'Decorations',
                open: false,
                buildProps: ['border-radius', 'border', 'box-shadow', 'background-color', 'background']
              },
              {
                name: 'Extra',
                open: false,
                buildProps: ['opacity', 'transition', 'perspective', 'transform']
              },
              {
                name: 'Flexbox',
                open: false,
                buildProps: ['flex-direction', 'justify-content', 'align-items', 'flex-wrap', 'align-content', 'order', 'flex-basis', 'flex-grow', 'flex-shrink', 'align-self']
              },
              {
                name: 'CSS Grid',
                open: false,
                buildProps: ['grid-template-columns', 'grid-template-rows', 'grid-column-gap', 'grid-row-gap', 'grid-column', 'grid-row', 'grid-area', 'justify-self', 'align-self']
              },
            ],
          },
          traitManager: {
            appendTo: '.traits-container',
          },
        });

        setEditor(newEditor);
      }
    }

    initEditor();

    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // Template functions
  const loadTemplate = (template: any) => {
    if (editor) {
      try {
        editor.setHtml(template.content);
        editor.setCss('');
        setShowTemplates(false);
        console.log('✅ Template loaded:', template.name);
      } catch (error) {
        console.error('❌ Error loading template:', error);
      }
    }
  };

  // Editor functions
  const undo = () => {
    if (editor) {
      try {
        editor.runCommand('core:undo');
        console.log('✅ Undo executed');
      } catch (error) {
        console.error('❌ Undo error:', error);
      }
    }
  };

  const redo = () => {
    if (editor) {
      try {
        editor.runCommand('core:redo');
        console.log('✅ Redo executed');
      } catch (error) {
        console.error('❌ Redo error:', error);
      }
    }
  };

  const clearCanvas = () => {
    if (editor) {
      try {
        editor.setHtml('');
        editor.setCss('');
        console.log('✅ Canvas cleared');
      } catch (error) {
        console.error('❌ Clear canvas error:', error);
      }
    }
  };

  const duplicateComponent = () => {
    if (editor) {
      try {
        const selected = editor.getSelected();
        if (selected) {
          const clone = selected.clone();
          selected.parent().append(clone);
          console.log('✅ Component duplicated');
        } else {
          console.log('⚠️ No component selected');
        }
      } catch (error) {
        console.error('❌ Duplicate error:', error);
      }
    }
  };

  // Export functions
  const exportHTML = () => {
    if (editor) {
      try {
        const html = editor.getHtml();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('✅ HTML exported');
      } catch (error) {
        console.error('❌ HTML export error:', error);
      }
    }
  };

  const exportCSS = () => {
    if (editor) {
      try {
        const css = editor.getCss();
        const blob = new Blob([css], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'style.css';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('✅ CSS exported');
      } catch (error) {
        console.error('❌ CSS export error:', error);
      }
    }
  };

  const exportJSON = () => {
    if (editor) {
      try {
        const json = editor.getProjectData();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('✅ JSON exported');
      } catch (error) {
        console.error('❌ JSON export error:', error);
      }
    }
  };

  const exportZIP = () => {
    if (editor) {
      try {
        const html = editor.getHtml();
        const css = editor.getCss();
        const js = editor.getJs();
        
        // Create a simple ZIP-like structure (simplified)
        const content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Project</title>
    <style>${css}</style>
</head>
<body>
${html}
<script>${js}</script>
</body>
</html>`;
        
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'complete-project.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('✅ Complete project exported');
      } catch (error) {
        console.error('❌ ZIP export error:', error);
      }
    }
  };

  // Import function
  const importProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file && editor) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const data = JSON.parse(e.target.result);
            editor.loadProjectData(data);
            console.log('✅ Project imported');
          } catch (error) {
            console.error('❌ Import error:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Responsive functions
  const setDevice = (device: 'desktop' | 'tablet' | 'mobile') => {
    if (editor) {
      try {
        editor.setDevice(device);
        console.log('✅ Device set to:', device);
      } catch (error) {
        console.error('❌ Device change error:', error);
      }
    }
  };

  // Zoom functions
  const zoomIn = () => {
    if (editor) {
      try {
        const canvas = editor.Canvas;
        const zoom = canvas.getZoom();
        canvas.setZoom(zoom + 0.1);
        console.log('✅ Zoomed in');
      } catch (error) {
        console.error('❌ Zoom in error:', error);
      }
    }
  };

  const zoomOut = () => {
    if (editor) {
      try {
        const canvas = editor.Canvas;
        const zoom = canvas.getZoom();
        canvas.setZoom(Math.max(0.1, zoom - 0.1));
        console.log('✅ Zoomed out');
      } catch (error) {
        console.error('❌ Zoom out error:', error);
      }
    }
  };

  const resetZoom = () => {
    if (editor) {
      try {
        const canvas = editor.Canvas;
        canvas.setZoom(1);
        console.log('✅ Zoom reset');
      } catch (error) {
        console.error('❌ Zoom reset error:', error);
      }
    }
  };

  const toggleFullscreen = () => {
    if (editor) {
      try {
        const canvas = editor.Canvas;
        canvas.toggleFullscreen();
        console.log('✅ Fullscreen toggled');
      } catch (error) {
        console.error('❌ Fullscreen error:', error);
      }
    }
  };

  return (
    <div style={{ background: 'var(--background-color)', minHeight: '100vh' }}>
      {/* Page Header - bruker samme struktur som andre sider */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Palette />
          </div>
          <div>
            <h1 className="page-title">🎨 WYSIWYG Editor</h1>
            <p className="page-subtitle">
              Design og rediger nettsider visuelt med avansert editor
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            Professional Editor
          </span>
          
          {/* Templates & Import */}
          <button 
            className="btn btn-primary"
            onClick={() => setShowTemplates(true)}
            title="Load Templates"
          >
            <FolderOpen style={{ width: '16px', height: '16px' }} />
            Templates
          </button>
          <button 
            className="btn btn-secondary"
            onClick={importProject}
            title="Import Project"
          >
            <Upload style={{ width: '16px', height: '16px' }} />
            Import
          </button>
          
          {/* Edit Functions */}
          <button 
            className="btn btn-secondary"
            onClick={undo}
            title="Undo (Ctrl+Z)"
          >
            <Undo style={{ width: '16px', height: '16px' }} />
            Undo
          </button>
          <button 
            className="btn btn-secondary"
            onClick={redo}
            title="Redo (Ctrl+Y)"
          >
            <Redo style={{ width: '16px', height: '16px' }} />
            Redo
          </button>
          <button 
            className="btn btn-secondary"
            onClick={duplicateComponent}
            title="Duplicate Selected Component"
          >
            <Copy style={{ width: '16px', height: '16px' }} />
            Duplicate
          </button>
          <button 
            className="btn btn-danger"
            onClick={clearCanvas}
            title="Clear Canvas"
          >
            <Trash2 style={{ width: '16px', height: '16px' }} />
            Clear
          </button>
          
          {/* Export Functions */}
          <button 
            className="btn btn-success"
            onClick={exportHTML}
            title="Export HTML"
          >
            <Download style={{ width: '16px', height: '16px' }} />
            HTML
          </button>
          <button 
            className="btn btn-warning"
            onClick={exportCSS}
            title="Export CSS"
          >
            <Code style={{ width: '16px', height: '16px' }} />
            CSS
          </button>
          <button 
            className="btn btn-danger"
            onClick={exportJSON}
            title="Export JSON Project"
          >
            <FileText style={{ width: '16px', height: '16px' }} />
            JSON
          </button>
          <button 
            className="btn btn-primary"
            onClick={exportZIP}
            title="Export Complete Project"
          >
            <Save style={{ width: '16px', height: '16px' }} />
            Complete
          </button>
          
          {/* View Functions */}
          <button 
            className="btn btn-primary"
            onClick={() => setShowPreview(true)}
            title="Live Preview"
          >
            <Eye style={{ width: '16px', height: '16px' }} />
            Preview
          </button>
          
          {/* Responsive */}
          <button 
            className="btn btn-secondary"
            onClick={() => setDevice('desktop')}
            title="Desktop View"
          >
            <Monitor style={{ width: '16px', height: '16px' }} />
            Desktop
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setDevice('tablet')}
            title="Tablet View"
          >
            <Tablet style={{ width: '16px', height: '16px' }} />
            Tablet
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setDevice('mobile')}
            title="Mobile View"
          >
            <Smartphone style={{ width: '16px', height: '16px' }} />
            Mobile
          </button>
          
          {/* Zoom Controls */}
          <button 
            className="btn btn-secondary"
            onClick={zoomIn}
            title="Zoom In"
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Zoom+
          </button>
          <button 
            className="btn btn-secondary"
            onClick={zoomOut}
            title="Zoom Out"
          >
            <MinusIcon style={{ width: '16px', height: '16px' }} />
            Zoom-
          </button>
          <button 
            className="btn btn-secondary"
            onClick={resetZoom}
            title="Reset Zoom"
          >
            <RotateCw style={{ width: '16px', height: '16px' }} />
            Reset
          </button>
          <button 
            className="btn btn-secondary"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            <Maximize style={{ width: '16px', height: '16px' }} />
            Fullscreen
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="card" style={{ marginBottom: '2rem', padding: '0' }}>
        <div style={{ display: 'flex', height: 'calc(100vh - 200px)', minHeight: '600px' }}>
          {/* Sidebar */}
          <div style={{ 
            width: '300px', 
            background: 'var(--white)', 
            borderRight: '1px solid var(--gray-200)',
            padding: 'var(--space-6)',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h3 style={{ 
                fontSize: 'var(--font-size-sm)', 
                fontWeight: '600', 
                color: 'var(--gray-700)', 
                marginBottom: 'var(--space-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Blocks
              </h3>
              <div className="blocks-container"></div>
            </div>
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h3 style={{ 
                fontSize: 'var(--font-size-sm)', 
                fontWeight: '600', 
                color: 'var(--gray-700)', 
                marginBottom: 'var(--space-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Layers
              </h3>
              <div className="layers-container"></div>
            </div>
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h3 style={{ 
                fontSize: 'var(--font-size-sm)', 
                fontWeight: '600', 
                color: 'var(--gray-700)', 
                marginBottom: 'var(--space-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Styles
              </h3>
              <div className="styles-container"></div>
            </div>
            <div>
              <h3 style={{ 
                fontSize: 'var(--font-size-sm)', 
                fontWeight: '600', 
                color: 'var(--gray-700)', 
                marginBottom: 'var(--space-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Traits
              </h3>
              <div className="traits-container"></div>
            </div>
          </div>

          {/* Canvas Area */}
          <div style={{ 
            flex: 1, 
            background: 'var(--background-color)', 
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              flex: 1,
              background: 'var(--white)', 
              borderRadius: 'var(--radius-lg)', 
              boxShadow: 'var(--shadow-sm)', 
              border: '1px solid var(--gray-200)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div ref={editorRef} style={{ width: '100%', height: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1200px', width: '90vw' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div className="card-icon">
                  <FolderOpen />
                </div>
                <div>
                  <h2 className="modal-title">Choose Template</h2>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', margin: 0 }}>
                    Select a professional template to get started
                  </p>
                </div>
              </div>
              <button 
                className="modal-close"
                onClick={() => setShowTemplates(false)}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: 'var(--space-6)' 
              }}>
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="card"
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'all var(--transition-normal)',
                      border: '1px solid var(--gray-200)'
                    }}
                    onClick={() => loadTemplate(template)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--gray-200)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ 
                      background: 'var(--gradient-secondary)', 
                      borderRadius: 'var(--radius-lg)', 
                      height: '160px', 
                      marginBottom: 'var(--space-4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Palette style={{ width: '48px', height: '48px', color: 'var(--white)' }} />
                    </div>
                    <h3 style={{ 
                      fontSize: 'var(--font-size-lg)', 
                      fontWeight: '600', 
                      color: 'var(--gray-900)', 
                      marginBottom: 'var(--space-2)' 
                    }}>
                      {template.name}
                    </h3>
                    <p style={{ 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--gray-600)', 
                      marginBottom: 'var(--space-4)',
                      lineHeight: '1.5'
                    }}>
                      {template.description}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between' 
                    }}>
                      <span style={{ 
                        fontSize: 'var(--font-size-xs)', 
                        color: 'var(--primary)', 
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Click to use
                      </span>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        background: 'var(--primary)', 
                        borderRadius: '50%' 
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1400px', width: '95vw', maxHeight: '95vh' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div className="card-icon">
                  <Eye />
                </div>
                <div>
                  <h2 className="modal-title">Live Preview</h2>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', margin: 0 }}>
                    Preview your design in real-time
                  </p>
                </div>
              </div>
              <button 
                className="modal-close"
                onClick={() => setShowPreview(false)}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0, background: 'var(--background-color)' }}>
              {editor && (
                <div 
                  style={{ 
                    background: 'var(--white)', 
                    borderRadius: 'var(--radius-lg)', 
                    boxShadow: 'var(--shadow-sm)', 
                    border: '1px solid var(--gray-200)',
                    overflow: 'hidden',
                    margin: 'var(--space-6)'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: editor.getHtml() + '<style>' + editor.getCss() + '</style>' 
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
