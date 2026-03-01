import React, { useState, useEffect, useRef } from 'react';
import { PenTool, Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { SmartField } from '../../types';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
    GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;
}

interface DocumentViewerProps {
    fileUrl: string;
    fields: SmartField[] | undefined;
    signature: string;
    onSignClick?: () => void;
    patientName: string;
    onFieldChange?: (fieldId: string, value: string) => void;
    readonly?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
    fileUrl,
    fields,
    signature,
    onSignClick,
    patientName,
    onFieldChange,
    readonly = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [currentPage, setCurrentPage] = useState(1);
    const [renderUrls, setRenderUrls] = useState<string[]>([]);
    const [isRendering, setIsRendering] = useState(false);

    const DOC_WIDTH = 800;
    const DOC_HEIGHT = 1132;

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { width } = containerRef.current.getBoundingClientRect();
                const newScale = Math.min(width / DOC_WIDTH, 1);
                setScale(newScale);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial calculation

        return () => window.removeEventListener('resize', handleResize);
    }, [renderUrls.length]);

    // Effect to render PDF to Image for Background
    useEffect(() => {
        let isMounted = true;

        const renderPdfToImage = async () => {
            // If it's already an image (e.g. data url from backend), just use it
            if (fileUrl.startsWith('data:image')) {
                setRenderUrls([fileUrl]);
                return;
            }

            setIsRendering(true);
            try {
                // Fetch the PDF
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error("Failed to fetch document");
                const arrayBuffer = await response.arrayBuffer();

                // Render using PDF.js
                const loadingTask = getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                const numPages = pdf.numPages;
                const pages: string[] = [];

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

                        pages.push(canvas.toDataURL('image/jpeg', 0.9));
                    }
                }

                if (isMounted) {
                    setRenderUrls(pages);
                }
            } catch (err) {
                console.error("Failed to render PDF in viewer:", err);
                // Fallback to original url, might be broken though
                if (isMounted) setRenderUrls([fileUrl]);
            } finally {
                if (isMounted) setIsRendering(false);
            }
        };

        if (fileUrl) {
            renderPdfToImage();
        }

        return () => { isMounted = false; };
    }, [fileUrl]);

    const handleZoomIn = () => setZoomLevel(z => Math.min(2.0, parseFloat((z + 0.25).toFixed(2))));
    const handleZoomOut = () => setZoomLevel(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))));

    const effectiveScale = scale * zoomLevel;

    if (isRendering || renderUrls.length === 0) {
        return (
            <div className="bg-slate-200/50 rounded-xl md:rounded-2xl border border-slate-300 overflow-hidden flex flex-col items-center justify-center p-12 text-slate-400 min-h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm font-medium">Processing Document...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Controls Bar */}
            <div className="flex items-center justify-between sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm py-2 px-3 rounded-xl border border-slate-200">
                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || renderUrls.length === 0}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-600 min-w-[60px] text-center">
                        {renderUrls.length > 0 ? `${currentPage} / ${renderUrls.length}` : '0 / 0'}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(renderUrls.length, p + 1))}
                        disabled={currentPage === renderUrls.length || renderUrls.length === 0}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                        aria-label="Next page"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 0.5}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                        aria-label="Zoom out"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-600 min-w-[38px] text-center">
                        {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= 2.0}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                        aria-label="Zoom in"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div
                ref={containerRef}
                className="bg-slate-200/50 rounded-xl md:rounded-2xl border border-slate-300 overflow-auto flex flex-col relative w-full items-center p-4 gap-8 min-h-[500px]"
            >
                {renderUrls.length > 0 && (() => {
                    const pageUrl = renderUrls[currentPage - 1];
                    const pageNum = currentPage;
                    const pageFields = fields?.filter(f => (f.page || 1) === pageNum) || [];

                    return (
                        <div
                            key={pageNum}
                            className="relative origin-top"
                            style={{
                                width: DOC_WIDTH,
                                height: DOC_HEIGHT,
                                transform: `scale(${effectiveScale})`,
                                marginBottom: `${(effectiveScale * DOC_HEIGHT) - DOC_HEIGHT}px`
                            }}
                        >
                            <div
                                className="absolute inset-0 bg-white shadow-xl ring-1 ring-black/5"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url(${pageUrl})`,
                                    backgroundSize: '100% 100%',
                                    backgroundRepeat: 'no-repeat',
                                }}
                            >
                                {pageFields.map((field) => (
                                    <div
                                        key={field.id}
                                        className="absolute"
                                        style={{ left: `${field.x}%`, top: `${field.y}%`, width: `${field.w}%`, height: `${field.h}%` }}
                                    >
                                        {field.type === 'SIGNATURE' ? (
                                            <div
                                                onClick={!readonly && onSignClick ? onSignClick : undefined}
                                                className={`w-full h-full rounded-lg border-2 transition-all flex items-center justify-center group 
                                                ${signature
                                                        ? 'bg-transparent border-transparent'
                                                        : (readonly ? 'bg-amber-50/30 border-amber-300 border-dashed' : 'bg-amber-50/50 border-amber-400 hover:bg-amber-100/50 cursor-pointer animate-pulse')}`}
                                            >
                                                {signature ? (
                                                    <img src={signature} alt="Signed" className="max-h-full max-w-full object-contain" />
                                                ) : readonly ? (
                                                    <span className="text-amber-500 font-bold uppercase tracking-widest text-[10px] opacity-60">Signature Block</span>
                                                ) : (
                                                    <div className="flex flex-col items-center text-amber-700 scale-90 md:scale-100">
                                                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm mb-1 uppercase tracking-wide whitespace-nowrap">Click to Sign</span>
                                                        <PenTool className="w-5 h-5 opacity-50" />
                                                    </div>
                                                )}
                                            </div>
                                        ) : field.type === 'CHECKBOX' ? (
                                            <div
                                                className="w-full h-full flex items-start pt-1"
                                                style={{ padding: '2px' }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => !readonly && onFieldChange && onFieldChange(field.id, field.value === 'true' ? 'false' : 'true')}
                                                    className={`border-2 rounded flex items-center justify-center flex-shrink-0 transition-all ${!readonly ? 'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 hover:scale-110 active:scale-95 cursor-pointer' : 'cursor-default'} ${field.value === 'true' ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-200' : 'bg-white border-slate-400 hover:border-blue-400'}`}
                                                    style={{ width: `${(field.fontSize || 14) + 6}px`, height: `${(field.fontSize || 14) + 6}px` }}
                                                    aria-label={field.label || 'Checkbox'}
                                                    aria-checked={field.value === 'true'}
                                                    role="checkbox"
                                                >
                                                    {field.value === 'true' && (
                                                        <svg className="text-white" viewBox="0 0 20 20" fill="currentColor" style={{ width: '70%', height: '70%' }}>
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </button>
                                                {field.label && (
                                                    <span
                                                        className="ml-2 leading-tight text-slate-900 cursor-pointer select-none"
                                                        style={{ fontSize: `${field.fontSize || 14}px`, fontWeight: field.fontWeight || 'normal', fontFamily: field.fontFamily || 'Inter, sans-serif' }}
                                                        onClick={() => !readonly && onFieldChange && onFieldChange(field.id, field.value === 'true' ? 'false' : 'true')}
                                                    >
                                                        {field.label}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div
                                                className="w-full h-full pt-1 px-1 text-slate-900 leading-tight overflow-hidden break-words"
                                                style={{
                                                    background: 'transparent',
                                                    fontSize: `${field.fontSize || 14}px`,
                                                    fontWeight: field.fontWeight || 'normal',
                                                    fontFamily: field.fontFamily || 'Inter, sans-serif',
                                                    textAlign: (field.textAlign || 'left') as any
                                                }}
                                            >
                                                {field.value || patientName}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};
