import io
import base64
from datetime import datetime
from pathlib import Path
from typing import Optional
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader, PdfWriter
from PIL import Image


class PDFGeneratorService:
    """Service to generate signed PDFs with signatures embedded"""
    
    def __init__(self, storage_path: str = "/app/signed_documents"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
    
    def generate_signed_pdf(
        self,
        document_id: str,
        signature_base64: str,
        patient_name: str,
        procedure_name: str,
        signed_date: datetime,
        certificate_hash: str,
        original_pdf_path: Optional[str] = None,
        signature_fields: Optional[list] = None
    ) -> str:
        """
        Generate a signed PDF with the signature embedded on the original document.
        
        Args:
            document_id: UUID of the document
            signature_base64: Base64 encoded signature image
            patient_name: Name of the signer
            procedure_name: Document/procedure name
            signed_date: When the document was signed
            certificate_hash: SHA-256 certificate hash
            original_pdf_path: Optional path to the original PDF file
            signature_fields: List of signature field positions and sizes
        
        Returns:
            Filepath to the signed PDF
        """
        
        filename = f"signed_{document_id}.pdf"
        filepath = self.storage_path / filename
        
        print(f"\n📝 GENERATE_SIGNED_PDF CALLED:")
        print(f"  - document_id: {document_id}")
        print(f"  - original_pdf_path: {original_pdf_path}")
        print(f"  - signature_fields: {signature_fields}")
        
        # If we have original PDF, overlay signature on it
        if original_pdf_path:
            print(f"  - Checking file exists: {Path(original_pdf_path).exists()}")
        else:
            print(f"  - ⚠️ original_pdf_path is None")
        
        if original_pdf_path and Path(original_pdf_path).exists():
            try:
                # Read the original PDF
                original_reader = PdfReader(original_pdf_path)
                writer = PdfWriter()
                
                # Decode signature image
                signature_data = signature_base64.split(',')[1] if ',' in signature_base64 else signature_base64
                signature_bytes = base64.b64decode(signature_data)
                signature_image = Image.open(io.BytesIO(signature_bytes))
                
                # Save signature to temp file
                temp_sig = io.BytesIO()
                signature_image.save(temp_sig, format='PNG')
                temp_sig.seek(0)
                
                # Process each page
                for page_num, page in enumerate(original_reader.pages):
                    page_width = float(page.mediabox.width)
                    page_height = float(page.mediabox.height)
                    
                    # Gather fields for this page
                    page_fields = []
                    if signature_fields:
                        for field in signature_fields:
                            # Frontend pages are 1-indexed, pdf pages are 0-indexed
                            field_page = field.get('page', 1)
                            if field_page - 1 == page_num:
                                page_fields.append(field)
                    
                    if page_fields:
                        # Create overlay with signature and text fields
                        packet = io.BytesIO()
                        can = canvas.Canvas(packet, pagesize=(page_width, page_height))
                        
                        for field in page_fields:
                            # Convert percentage-based coordinates to PDF coordinates
                            # Fields use percentage (0-100) from top-left
                            # PDF uses points from bottom-left
                            x_percent = field.get('x', 10)
                            y_percent = field.get('y', 70)
                            w_percent = field.get('w', 30)
                            h_percent = field.get('h', 10)
                            
                            # Calculate actual positions
                            x_pos = (x_percent / 100) * page_width
                            y_pos = page_height - ((y_percent / 100) * page_height) - ((h_percent / 100) * page_height)
                            width = (w_percent / 100) * page_width
                            height = (h_percent / 100) * page_height
                            
                            field_type = field.get('type')
                            
                            if field_type == 'SIGNATURE':
                                # Draw signature image at the field position
                                temp_sig.seek(0)
                                can.drawImage(
                                    ImageReader(temp_sig),
                                    x_pos, y_pos,
                                    width=width,
                                    height=height,
                                    preserveAspectRatio=True,
                                    mask='auto'
                                )
                            elif field_type in ['TEXT', 'DATE', 'TITLE']:
                                value = field.get('value', '')
                                if value:
                                    font_size = field.get('fontSize', 14)
                                    is_bold = field.get('fontWeight') == 'bold'
                                    font_name = "Helvetica-Bold" if is_bold else "Helvetica"
                                    
                                    can.setFont(font_name, font_size)
                                    can.setFillColorRGB(0, 0, 0)
                                    
                                    # Adjust y_pos for text (bottom-left origin, need to add height or use baseline)
                                    text_y = y_pos + (height * 0.2)
                                    
                                    align = field.get('textAlign', 'left')
                                    if align == 'center':
                                        can.drawCentredString(x_pos + width/2, text_y, value)
                                    elif align == 'right':
                                        can.drawRightString(x_pos + width, text_y, value)
                                    else:
                                        can.drawString(x_pos, text_y, value)
                        
                        can.save()
                        packet.seek(0)
                        
                        # Merge overlay with original page
                        overlay_reader = PdfReader(packet)
                        page.merge_page(overlay_reader.pages[0])
                    
                    writer.add_page(page)
                
                # Add certificate page at the end
                cert_page = self._create_certificate_page(
                    procedure_name, patient_name, signed_date, 
                    certificate_hash, document_id, signature_base64
                )
                writer.add_page(cert_page)
                
                # Write to output file
                with open(filepath, 'wb') as output_file:
                    writer.write(output_file)
                
                print(f"✅ Signed PDF generated with signature overlaid on original document: {filepath}")
                return str(filepath)
                
            except Exception as e:
                print(f"⚠️ Error overlaying signature on PDF: {e}")
                import traceback
                traceback.print_exc()
        
        # Fallback: Create certificate-only PDF
        print(f"ℹ️ Creating certificate-only PDF (no original file stored)")
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        self._draw_certificate_content(
            can, procedure_name, patient_name, signed_date,
            certificate_hash, document_id, signature_base64
        )
        can.save()
        packet.seek(0)
        
        with open(filepath, 'wb') as f:
            f.write(packet.read())
        
        print(f"✅ Signed PDF certificate generated: {filepath}")
        return str(filepath)
    
    def _create_certificate_page(
        self, procedure_name: str, patient_name: str, signed_date: datetime,
        certificate_hash: str, document_id: str, signature_base64: str
    ):
        """Create a certificate page as a PdfReader page"""
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        self._draw_certificate_content(
            can, procedure_name, patient_name, signed_date,
            certificate_hash, document_id, signature_base64
        )
        can.save()
        packet.seek(0)
        reader = PdfReader(packet)
        return reader.pages[0]
    
    def _create_certificate_page_canvas(
        self, procedure_name: str, patient_name: str, signed_date: datetime,
        certificate_hash: str, document_id: str, signature_base64: str
    ) -> io.BytesIO:
        """Create a certificate page and return as BytesIO"""
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        self._draw_certificate_content(
            can, procedure_name, patient_name, signed_date,
            certificate_hash, document_id, signature_base64
        )
        can.save()
        packet.seek(0)
        return packet
    
    def _draw_certificate_content(
        self, can: canvas.Canvas, procedure_name: str, patient_name: str,
        signed_date: datetime, certificate_hash: str, document_id: str,
        signature_base64: str
    ):
        """Draw certificate content on a canvas"""
        width, height = letter
        
        # Header with border
        can.setStrokeColorRGB(0.2, 0.3, 0.6)
        can.setLineWidth(2)
        can.rect(30, height - 150, width - 60, 130, stroke=1, fill=0)
        
        # Title
        can.setFillColorRGB(0.2, 0.3, 0.6)
        can.setFont("Helvetica-Bold", 20)
        can.drawCentredString(width / 2, height - 50, "DIGITALLY SIGNED DOCUMENT")
        
        # Document info box
        can.setFillColorRGB(0, 0, 0)
        can.setFont("Helvetica-Bold", 12)
        can.drawString(50, height - 80, "Document:")
        can.setFont("Helvetica", 12)
        can.drawString(150, height - 80, procedure_name)
        
        can.setFont("Helvetica-Bold", 12)
        can.drawString(50, height - 100, "Signed by:")
        can.setFont("Helvetica", 12)
        can.drawString(150, height - 100, patient_name)
        
        can.setFont("Helvetica-Bold", 12)
        can.drawString(50, height - 120, "Date & Time:")
        can.setFont("Helvetica", 12)
        can.drawString(150, height - 120, signed_date.strftime('%Y-%m-%d %H:%M:%S UTC'))
        
        # Signature section
        can.setStrokeColorRGB(0.8, 0.8, 0.8)
        can.setLineWidth(1)
        can.rect(30, height - 400, width - 60, 220, stroke=1, fill=0)
        
        can.setFillColorRGB(0, 0, 0)
        can.setFont("Helvetica-Bold", 14)
        can.drawString(50, height - 180, "Digital Signature:")
        
        # Add signature image
        try:
            # Decode base64 signature
            signature_data = signature_base64.split(',')[1] if ',' in signature_base64 else signature_base64
            signature_bytes = base64.b64decode(signature_data)
            signature_image = Image.open(io.BytesIO(signature_bytes))
            
            # Save temp signature
            temp_sig = io.BytesIO()
            signature_image.save(temp_sig, format='PNG')
            temp_sig.seek(0)
            
            # Center the signature
            sig_width = 300
            sig_height = 120
            x_pos = (width - sig_width) / 2
            can.drawImage(ImageReader(temp_sig), x_pos, height - 350, width=sig_width, height=sig_height, preserveAspectRatio=True, mask='auto')
            
        except Exception as e:
            print(f"⚠️ Error adding signature image: {e}")
            can.setFont("Helvetica", 10)
            can.drawString(50, height - 250, "[Signature image could not be rendered]")
        
        # Certificate hash section
        can.setFont("Helvetica-Bold", 10)
        can.drawString(50, height - 430, "Digital Certificate (SHA-256):")
        can.setFont("Courier", 7)
        
        # Split hash into multiple lines for readability
        hash_line1 = certificate_hash[:32]
        hash_line2 = certificate_hash[32:]
        can.drawString(50, height - 445, hash_line1)
        can.drawString(50, height - 455, hash_line2)
        
        # Verification notice
        can.setFont("Helvetica", 8)
        can.setFillColorRGB(0.3, 0.3, 0.3)
        can.drawString(50, height - 480, "This document is cryptographically signed and tamper-evident.")
        can.drawString(50, height - 493, "Any modification to this document will invalidate the digital signature.")
        
        # Footer
        can.setFont("Helvetica", 7)
        can.setFillColorRGB(0.5, 0.5, 0.5)
        can.drawString(50, 50, f"Document ID: {document_id}")
        can.drawString(50, 40, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        can.drawRightString(width - 50, 50, "Powered by WizeSign")
    
    def get_download_path(self, document_id: str) -> Optional[Path]:
        """Get the path to a signed PDF if it exists"""
        filename = f"signed_{document_id}.pdf"
        filepath = self.storage_path / filename
        return filepath if filepath.exists() else None


# Singleton instance
pdf_generator_service = PDFGeneratorService()
