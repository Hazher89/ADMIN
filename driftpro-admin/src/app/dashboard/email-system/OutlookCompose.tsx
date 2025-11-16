/**
 * Outlook-style Compose Window
 * 
 * Full-featured email composition with:
 * - Rich text editor
 * - Attachment support
 * - Case ID injection
 * - Template suggestions
 * - All Outlook compose features
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X, Send, Paperclip, Image, Link as LinkIcon, Emoji, Bold, Italic,
  Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Quote, Undo, Redo, Minus, Maximize2, Minimize2, Sparkles
} from 'lucide-react';

interface OutlookComposeProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    bodyType: 'text' | 'html';
    attachments?: File[];
    importance?: 'low' | 'normal' | 'high';
  }) => Promise<void>;
  initialData?: {
    to?: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    body?: string;
    caseId?: string;
  };
  templates?: any[];
  suggestedTemplate?: any;
  relatedCases?: any[];
}

export default function OutlookCompose({
  isOpen,
  onClose,
  onSend,
  initialData = {},
  templates = [],
  suggestedTemplate,
  relatedCases = []
}: OutlookComposeProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [to, setTo] = useState(initialData.to || '');
  const [cc, setCc] = useState(initialData.cc || '');
  const [bcc, setBcc] = useState(initialData.bcc || '');
  const [subject, setSubject] = useState(initialData.subject || '');
  const [body, setBody] = useState(initialData.body || '');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [importance, setImportance] = useState<'low' | 'normal' | 'high'>('normal');
  const [isSending, setIsSending] = useState(false);
  const [useHtml, setUseHtml] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  
  // Auto-inject case ID in subject
  useEffect(() => {
    if (initialData.caseId && !subject.includes(initialData.caseId)) {
      if (!subject.match(/\[MAVI-\d{8}-[A-Z]{3}-[a-z0-9]{6}\]/)) {
        setSubject(`[${initialData.caseId}] ${subject}`);
      }
    }
  }, [initialData.caseId, subject]);
  
  // Auto-inject footer with case ID
  useEffect(() => {
    if (initialData.caseId && !body.includes('MAVI saks-ID:')) {
      const footer = `\n\n—\nMAVI saks-ID: ${initialData.caseId}\nKontakt kjørekontor: 40175012 (07:00–20:30, lør 09:00–14:00)`;
      if (!body.endsWith(footer)) {
        setBody(body + footer);
      }
    }
  }, [initialData.caseId, body]);
  
  const handleAttach = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };
  
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSend = async () => {
    if (!to.trim()) {
      alert('Vennligst fyll inn mottaker');
      return;
    }
    
    setIsSending(true);
    try {
      await onSend({
        to: to.split(',').map(e => e.trim()).filter(Boolean),
        cc: cc ? cc.split(',').map(e => e.trim()).filter(Boolean) : undefined,
        bcc: bcc ? bcc.split(',').map(e => e.trim()).filter(Boolean) : undefined,
        subject,
        body,
        bodyType: useHtml ? 'html' : 'text',
        attachments,
        importance
      });
      onClose();
      // Reset form
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setAttachments([]);
      setImportance('normal');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Kunne ikke sende e-post');
    } finally {
      setIsSending(false);
    }
  };
  
  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    bodyRef.current?.focus();
  };
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: isMinimized ? '0' : '100px',
      right: '20px',
      width: isMaximized ? 'calc(100vw - 40px)' : isMinimized ? '350px' : '600px',
      height: isMaximized ? 'calc(100vh - 120px)' : isMinimized ? '50px' : '600px',
      background: 'var(--card-background)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      transition: 'all 0.3s'
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'var(--primary)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopLeftRadius: 'var(--radius-lg)',
        borderTopRightRadius: 'var(--radius-lg)',
        cursor: 'move'
      }}>
        <span style={{ fontWeight: '600', fontSize: 'var(--font-size-sm)' }}>
          Ny e-post
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {suggestedTemplate && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)'
            }}>
              <Sparkles size={12} />
              <span>Mal anbefalt</span>
            </div>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          {/* Toolbar */}
          <div style={{
            padding: '0.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              padding: '0.25rem 0.5rem',
              fontSize: 'var(--font-size-xs)',
              fontWeight: '600',
              color: 'var(--text-color)'
            }}>
              Send
            </div>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value as any)}
              style={{
                padding: '0.25rem 0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--background-color)',
                color: 'var(--text-color)',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              <option value="low">Lav prioritet</option>
              <option value="normal">Normal prioritet</option>
              <option value="high">Høy prioritet</option>
            </select>
            
            <div style={{ flex: 1 }} />
            
            {/* Formatting Toolbar */}
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <button
                onClick={() => applyFormatting('bold')}
                style={{
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Fet"
              >
                <Bold size={14} />
              </button>
              <button
                onClick={() => applyFormatting('italic')}
                style={{
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Kursiv"
              >
                <Italic size={14} />
              </button>
              <button
                onClick={() => applyFormatting('underline')}
                style={{
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Understrek"
              >
                <Underline size={14} />
              </button>
              
              <div style={{
                width: '1px',
                height: '20px',
                background: 'var(--border-color)',
                margin: '0 0.25rem'
              }} />
              
              <button
                onClick={() => applyFormatting('justifyLeft')}
                style={{
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Venstrejuster"
              >
                <AlignLeft size={14} />
              </button>
              <button
                onClick={() => applyFormatting('justifyCenter')}
                style={{
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Senterjuster"
              >
                <AlignCenter size={14} />
              </button>
              <button
                onClick={() => applyFormatting('justifyRight')}
                style={{
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Høyrejuster"
              >
                <AlignRight size={14} />
              </button>
              
              <div style={{
                width: '1px',
                height: '20px',
                background: 'var(--border-color)',
                margin: '0 0.25rem'
              }} />
              
              <button
                onClick={handleAttach}
                style={{
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Legg til vedlegg"
              >
                <Paperclip size={14} />
              </button>
            </div>
          </div>
          
          {/* Form */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Recipients */}
            <div style={{
              padding: '0.5rem 1rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  minWidth: '60px',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-color)',
                  fontWeight: '500'
                }}>
                  Til
                </span>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Mottakere"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-color)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  minWidth: '60px',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-color)',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const ccInput = document.getElementById('cc-input');
                  if (ccInput) {
                    (ccInput as HTMLInputElement).style.display = 
                      (ccInput as HTMLInputElement).style.display === 'none' ? 'flex' : 'none';
                  }
                }}
                >
                  Kopi
                </span>
                <input
                  id="cc-input"
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Kopi"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-color)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Emne"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-color)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500'
                  }}
                />
              </div>
            </div>
            
            {/* Template Suggestions */}
            {suggestedTemplate && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--blue-50)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--blue-700)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Sparkles size={14} />
                  <span style={{ fontWeight: '600' }}>Forslag: {suggestedTemplate.name}</span>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--blue-600)' }}>
                  Template er allerede anvendt. Du kan endre variabler etter behov.
                </div>
              </div>
            )}
            
            {/* Related Cases Warning */}
            {relatedCases.length > 0 && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--yellow-50)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--yellow-700)'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  Relaterte saker funnet ({relatedCases.length})
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--yellow-600)' }}>
                  Det finnes andre saker med samme ordrenr., telefon eller adresse.
                </div>
              </div>
            )}
            
            {/* Attachments */}
            {attachments.length > 0 && (
              <div style={{
                padding: '0.5rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      background: 'var(--gray-100)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-xs)'
                    }}
                  >
                    <Paperclip size={14} />
                    <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                    <button
                      onClick={() => handleRemoveAttachment(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Body Editor */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {useHtml ? (
                <div
                  ref={bodyRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setBody(e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: body }}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: 'none',
                    outline: 'none',
                    background: 'var(--background-color)',
                    color: 'var(--text-color)',
                    fontSize: 'var(--font-size-base)',
                    lineHeight: '1.6',
                    overflowY: 'auto',
                    fontFamily: 'var(--font-family)'
                  }}
                />
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: 'none',
                    outline: 'none',
                    background: 'var(--background-color)',
                    color: 'var(--text-color)',
                    fontSize: 'var(--font-size-base)',
                    lineHeight: '1.6',
                    resize: 'none',
                    fontFamily: 'var(--font-family)'
                  }}
                  placeholder="Skriv melding..."
                />
              )}
            </div>
            
            {/* Footer */}
            <div style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => setUseHtml(!useHtml)}
                  className="btn btn-secondary"
                  style={{ fontSize: 'var(--font-size-xs)', padding: '0.5rem 1rem' }}
                >
                  {useHtml ? 'Tekst' : 'HTML'}
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ fontSize: 'var(--font-size-sm)', padding: '0.5rem 1rem' }}
                >
                  Avbryt
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending || !to.trim()}
                  className="btn btn-primary"
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    padding: '0.5rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Send size={16} />
                  {isSending ? 'Sender...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}





