import React, { useState, useEffect, useRef } from 'react';
import { PenTool, Loader2 } from 'lucide-react';
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
    onSignClick: () => void;
    patientName: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
    fileUrl,
    fields,
    signature,
    onSignClick,
    patientName
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
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

    if (isRendering || renderUrls.length === 0) {
        return (
            <div className="bg-slate-200/50 rounded-xl md:rounded-2xl border border-slate-300 overflow-hidden flex flex-col items-center justify-center p-12 text-slate-400 min-h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm font-medium">Processing Document...</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="bg-slate-200/50 rounded-xl md:rounded-2xl border border-slate-300 overflow-hidden flex flex-col relative w-full items-center p-4 gap-8"
        >
            {renderUrls.map((pageUrl, index) => {
                const pageNum = index + 1;
                const pageFields = fields?.filter(f => (f.page || 1) === pageNum) || [];

                return (
                    <div
                        key={pageNum}
                        className="relative origin-top"
                        style={{
                            width: DOC_WIDTH,
                            height: DOC_HEIGHT,
                            transform: `scale(${scale})`,
                            marginBottom: `${(scale * DOC_HEIGHT) - DOC_HEIGHT}px`
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
                                <div key={field.id} className="absolute flex flex-col justify-end" style={{ left: `${field.x}%`, top: `${field.y}%`, width: `${field.w}%`, height: `${field.h}%` }}>
                                    {field.type === 'SIGNATURE' ? (
                                        <button
                                            onClick={onSignClick}
                                            className={`w-full h-full rounded-lg border-2 transition-all flex items-center justify-center group 
                                            ${signature
                                                    ? 'bg-transparent border-transparent'
                                                    : 'bg-amber-50/50 border-amber-400 hover:bg-amber-100/50 cursor-pointer animate-pulse'}`}
                                        >
                                            {signature ? (
                                                <img src={signature} alt="Signed" className="max-h-full max-w-full object-contain" />
                                            ) : (
                                                <div className="flex flex-col items-center text-amber-700 scale-90 md:scale-100">
                                                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm mb-1 uppercase tracking-wide whitespace-nowrap">Click to Sign</span>
                                                    <PenTool className="w-5 h-5 opacity-50" />
                                                </div>
                                            )}
                                        </button>
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-end px-2 pb-1 font-serif text-slate-900 leading-none"
                                            style={{
                                                background: 'transparent',
                                                fontSize: `${field.fontSize || 14}px`,
                                                fontWeight: field.fontWeight || 'normal',
                                                textAlign: field.textAlign || 'left' as any
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
            })}
        </div>
    );
};
