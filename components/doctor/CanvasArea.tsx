import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

if (typeof window !== 'undefined') {
    GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;
}

const RESIZE_HANDLES = [
    { id: 'nw', class: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize' },
    { id: 'n', class: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize' },
    { id: 'ne', class: 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize' },
    { id: 'e', class: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-e-resize' },
    { id: 'se', class: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize' },
    { id: 's', class: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize' },
    { id: 'sw', class: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize' },
    { id: 'w', class: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-w-resize' },
];

interface CanvasAreaProps {
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
    editingFieldId: string | null;
    setEditingFieldId: (id: string | null) => void;
    validationErrors: Set<string>;
    onClearValidationError: (id: string) => void;
    isProcessingPdf: boolean;
    currentPage: number;
    setCurrentPage: (page: number) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
    selectedIds,
    setSelectedIds,
    editingFieldId,
    setEditingFieldId,
    validationErrors,
    onClearValidationError,
    isProcessingPdf: externalIsProcessing,
    currentPage,
    setCurrentPage
}) => {
    const {
        consentForm, updateField, removeField, setActiveFieldId, updateConsentForm
    } = useAppStore();

    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRefs = useRef<Record<number, HTMLDivElement | null>>({});

    // Scaling
    const [scale, setScale] = useState(1);
    const DOC_WIDTH = 800;
    const DOC_HEIGHT = 1132;

    // PDF Rendering
    const [pages, setPages] = useState<string[]>([]);
    const [isRendering, setIsRendering] = useState(false);

    // Drag / Resize State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPositions, setDragStartPositions] = useState<Record<string, { x: number, y: number }>>({});
    const [dragStartMouse, setDragStartMouse] = useState({ x: 0, y: 0 });
    const [resizing, setResizing] = useState<{
        id: string;
        handle: string;
        start: { x: number; y: number; fieldX: number; fieldY: number; fieldW: number; fieldH: number };
        page: number;
    } | null>(null);

    // Render PDF Pages
    useEffect(() => {
        let isMounted = true;
        const renderPdf = async () => {
            const fileUrl = consentForm.fileUrl;
            if (!fileUrl) return;

            if (fileUrl.startsWith('data:image') || consentForm.fileType?.startsWith('image/')) {
                setPages([fileUrl]);
                return;
            }

            setIsRendering(true);
            try {
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error("Failed to fetch document");
                const arrayBuffer = await response.arrayBuffer();

                const loadingTask = getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                const numPages = pdf.numPages;
                const renderedPages: string[] = [];

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const originalViewport = page.getViewport({ scale: 1 });
                    const pdfScale = 1600 / originalViewport.width;
                    const viewport = page.getViewport({ scale: pdfScale });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    if (context) {
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        await page.render({ canvasContext: context, viewport }).promise;
                        renderedPages.push(canvas.toDataURL('image/jpeg', 0.9));
                    }
                }

                if (isMounted) {
                    setPages(renderedPages);
                }
            } catch (err) {
                console.error("Failed to render PDF in viewer:", err);
                if (isMounted && consentForm.previewUrl) setPages([consentForm.previewUrl]);
            } finally {
                if (isMounted) setIsRendering(false);
            }
        };

        if (consentForm.fileUrl && pages.length === 0) {
            renderPdf();
        }
        return () => { isMounted = false; };
    }, [consentForm.fileUrl, consentForm.previewUrl, consentForm.fileType, pages.length]);

    useEffect(() => {
        const handleResize = () => {
            if (wrapperRef.current) {
                const { width } = wrapperRef.current.getBoundingClientRect();
                const availableWidth = width - 40;
                const newScale = Math.min(availableWidth / DOC_WIDTH, 1);
                setScale(newScale);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [pages.length]);

    // Drag & Drop Handlers
    const handleMouseDown = (e: React.MouseEvent, id: string, pageNum: number) => {
        e.stopPropagation();

        const container = containerRefs.current[pageNum];
        if (!container) return;

        let newSelection = new Set(selectedIds);
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
            if (newSelection.has(id)) newSelection.delete(id);
            else newSelection.add(id);
        } else {
            if (!newSelection.has(id)) newSelection = new Set([id]);
        }

        setSelectedIds(newSelection);
        setActiveFieldId(id);

        if (newSelection.has(id)) {
            setIsDragging(true);
            setDragStartMouse({ x: e.clientX, y: e.clientY });
            const positions: Record<string, { x: number, y: number }> = {};
            consentForm.fields?.forEach(f => {
                if (newSelection.has(f.id)) positions[f.id] = { x: f.x, y: f.y };
            });
            setDragStartPositions(positions);
        }
    };

    // Window Listeners for Drag/Resize
    useEffect(() => {
        if (!isDragging && !resizing) return;

        const handleWindowMouseMove = (e: MouseEvent) => {
            if (resizing) {
                const container = containerRefs.current[resizing.page];
                if (!container) return;
                const containerRect = container.getBoundingClientRect();

                const dxPixels = e.clientX - resizing.start.x;
                const dyPixels = e.clientY - resizing.start.y;

                const dxPerc = (dxPixels / containerRect.width) * 100;
                const dyPerc = (dyPixels / containerRect.height) * 100;

                let { fieldX, fieldY, fieldW, fieldH } = resizing.start;
                const h = resizing.handle;

                if (h.includes('e')) fieldW = Math.max(2, fieldW + dxPerc);
                if (h.includes('w')) {
                    const applied = Math.min(fieldW - 2, dxPerc);
                    fieldX += applied; fieldW -= applied;
                }
                if (h.includes('s')) fieldH = Math.max(1, fieldH + dyPerc);
                if (h.includes('n')) {
                    const applied = Math.min(fieldH - 1, dyPerc);
                    fieldY += applied; fieldH -= applied;
                }
                updateField(resizing.id, { x: fieldX, y: fieldY, w: fieldW, h: fieldH });
            }
            else if (isDragging) {
                // Determine drag delta using the first selected element's page container
                // Assuming multi-page multi-selection drag is rare/tricky, we use scale
                const dxPixels = e.clientX - dragStartMouse.x;
                const dyPixels = e.clientY - dragStartMouse.y;

                const dxPerc = (dxPixels / (DOC_WIDTH * scale)) * 100;
                const dyPerc = (dyPixels / (DOC_HEIGHT * scale)) * 100;

                selectedIds.forEach(id => {
                    const startPos = dragStartPositions[id];
                    if (startPos) updateField(id, { x: startPos.x + dxPerc, y: startPos.y + dyPerc });
                });
            }
        };

        const handleWindowMouseUp = () => { setIsDragging(false); setResizing(null); };
        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => { window.removeEventListener('mousemove', handleWindowMouseMove); window.removeEventListener('mouseup', handleWindowMouseUp); };
    }, [isDragging, resizing, selectedIds, dragStartMouse, dragStartPositions, updateField, scale]);


    const isProcessing = externalIsProcessing || isRendering;

    return (
        <div className="flex-1 bg-slate-200/50 rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden flex flex-col relative shadow-inner order-1 lg:order-2">
            <div
                ref={wrapperRef}
                className="flex-1 overflow-auto flex flex-col items-center p-4 md:p-8 relative gap-8"
                onClick={(e) => { if (e.target === e.currentTarget) { setSelectedIds(new Set()); setActiveFieldId(null); } }}
            >
                {pages.length > 0 ? (
                    <div className="flex flex-col items-center w-full">
                        {(() => {
                            const pageNum = currentPage;
                            const pageUrl = pages[pageNum - 1];
                            const pageFields = consentForm.fields?.filter(f => (f.page || 1) === pageNum) || [];

                            if (!pageUrl) return null;

                            return (
                                <div key={pageNum} className="relative origin-top" style={{ width: DOC_WIDTH, height: DOC_HEIGHT, transform: `scale(${scale})`, marginBottom: `${(scale * DOC_HEIGHT) - DOC_HEIGHT}px` }}>
                                    <div
                                        ref={el => { containerRefs.current[pageNum] = el; }}
                                        className="absolute inset-0 bg-white shadow-2xl transition-all select-none ring-1 ring-black/5"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundImage: `url(${pageUrl})`,
                                            backgroundSize: '100% 100%',
                                            backgroundRepeat: 'no-repeat',
                                        }}
                                        onClick={(e) => {
                                            if (e.target === e.currentTarget) {
                                                setSelectedIds(new Set());
                                                setActiveFieldId(null);
                                                setEditingFieldId(null);
                                            }
                                        }}
                                    >
                                        {pageFields.map((field) => {
                                            const isError = validationErrors.has(field.id);
                                            const isSelected = selectedIds.has(field.id);
                                            const isEditing = editingFieldId === field.id;
                                            return (
                                                <div
                                                    key={field.id}
                                                    onMouseDown={(e) => handleMouseDown(e, field.id, pageNum)}
                                                    onDoubleClick={(e) => { e.stopPropagation(); if (field.type !== 'SIGNATURE') setEditingFieldId(field.id); }}
                                                    className={`absolute flex flex-col group ${isSelected ? 'z-40' : 'z-10'}`}
                                                    style={{ left: `${field.x}%`, top: `${field.y}%`, width: `${field.w}%`, height: `${field.h}%`, cursor: isSelected ? 'move' : 'pointer' }}
                                                >
                                                    <div className={`w-full h-full flex items-center relative transition-all ${field.type === 'SIGNATURE' ? 'bg-amber-50/30' : 'bg-transparent'} ${isSelected ? 'border-2 border-blue-500' : `border border-dashed ${isError ? 'border-red-500 bg-red-50/10' : 'border-slate-400 hover:border-blue-400'}`}`}>
                                                        {isSelected && selectedIds.size === 1 && RESIZE_HANDLES.map(handle => (
                                                            <div key={handle.id} className={`absolute w-3 h-3 bg-white border border-blue-600 rounded-full z-50 ${handle.class}`} onMouseDown={(e) => { e.stopPropagation(); setIsDragging(false); setSelectedIds(new Set([field.id])); setActiveFieldId(field.id); setResizing({ id: field.id, handle: handle.id, start: { x: e.clientX, y: e.clientY, fieldX: field.x, fieldY: field.y, fieldW: field.w, fieldH: field.h }, page: pageNum }); }} />
                                                        ))}

                                                        {isEditing ? (
                                                            <input autoFocus className="w-full h-full bg-transparent border-none outline-none font-sans font-medium p-1 text-slate-900" style={{ fontSize: `${field.fontSize || 14}px`, fontWeight: field.fontWeight || 'normal', textAlign: field.textAlign || 'left' as any }} value={field.value || ''} onChange={(e) => { updateField(field.id, { value: e.target.value }); if (validationErrors.has(field.id)) { onClearValidationError(field.id); } }} onBlur={() => { setEditingFieldId(null); if (field.id.includes('title-field')) updateConsentForm({ procedureName: field.value }); }} onMouseDown={(e) => e.stopPropagation()} />
                                                        ) : (
                                                            <div className={`w-full h-full flex items-center ${field.type === 'SIGNATURE' ? 'justify-center' : 'justify-start px-1'}`}>
                                                                {field.type === 'SIGNATURE' ? (
                                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-amber-600' : 'text-amber-600/50'}`}>Signature</span>
                                                                ) : (
                                                                    <span className="truncate w-full font-sans" style={{ fontSize: `${field.fontSize || 14}px`, fontWeight: field.fontWeight || 'normal', textAlign: field.textAlign || 'left' as any }}>
                                                                        {field.value ? (
                                                                            <span className="text-slate-900">{field.value}</span>
                                                                        ) : (
                                                                            <span className="text-slate-400/50 italic font-normal">{field.label}</span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {(isSelected || isError) && <div className={`absolute -top-5 left-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white shadow-sm whitespace-nowrap pointer-events-none ${isError ? 'bg-red-500' : 'bg-blue-500'}`}>{isError ? 'Required' : field.label}</div>}
                                                        {isSelected && selectedIds.size === 1 && <button onMouseDown={(e) => { e.stopPropagation(); removeField(field.id); setSelectedIds(new Set()); }} className="absolute -top-3 -right-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-full p-1 shadow-sm hover:scale-110 z-50"><Trash2 className="w-3 h-3" /></button>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="mt-8 flex items-center justify-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 z-50 relative">
                            <button onClick={(e) => { e.stopPropagation(); setCurrentPage(Math.max(1, currentPage - 1)); }} disabled={currentPage === 1} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-50 text-sm font-medium transition-colors">Previous</button>
                            <span className="text-sm font-bold text-slate-600">Page {currentPage} of {pages.length}</span>
                            <button onClick={(e) => { e.stopPropagation(); setCurrentPage(Math.min(pages.length, currentPage + 1)); }} disabled={currentPage === pages.length} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-md disabled:opacity-50 text-sm font-medium transition-colors">Next</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 h-full w-full absolute inset-0">
                        <Loader2 className={`w-8 h-8 animate-spin mb-2 ${isProcessing ? 'text-blue-600' : ''}`} />
                        <p className="text-sm font-medium">{isProcessing ? 'Processing PDF...' : 'Loading canvas...'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
