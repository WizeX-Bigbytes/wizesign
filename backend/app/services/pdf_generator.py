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
        signature_fields: Optional[list] = None,
        ip_address: Optional[str] = None,
        phone_number: Optional[str] = None
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

                            elif field_type == 'CHECKBOX':
                                font_size = field.get('fontSize', 14)
                                box_size = font_size + 4
                                box_x = x_pos
                                box_y = y_pos + (height - box_size) / 2  # vertically center in field

                                is_checked = str(field.get('value', 'false')).lower() == 'true'

                                if is_checked:
                                    # Filled blue box
                                    can.setFillColorRGB(0.22, 0.45, 0.93)  # blue-600
                                    can.setStrokeColorRGB(0.22, 0.45, 0.93)
                                    can.rect(box_x, box_y, box_size, box_size, fill=1, stroke=0)

                                    # White checkmark using lines
                                    can.setStrokeColorRGB(1, 1, 1)
                                    can.setLineWidth(max(1.5, box_size * 0.12))
                                    can.setLineCap(1)  # round
                                    can.setLineJoin(1)  # round
                                    # tick: short left leg then long right leg
                                    tick_x1 = box_x + box_size * 0.18
                                    tick_y1 = box_y + box_size * 0.45
                                    tick_x2 = box_x + box_size * 0.38
                                    tick_y2 = box_y + box_size * 0.22
                                    tick_x3 = box_x + box_size * 0.80
                                    tick_y3 = box_y + box_size * 0.72
                                    p = can.beginPath()
                                    p.moveTo(tick_x1, tick_y1)
                                    p.lineTo(tick_x2, tick_y2)
                                    p.lineTo(tick_x3, tick_y3)
                                    can.drawPath(p, stroke=1, fill=0)
                                else:
                                    # Empty box outline
                                    can.setStrokeColorRGB(0.4, 0.4, 0.4)
                                    can.setLineWidth(1)
                                    can.rect(box_x, box_y, box_size, box_size, fill=0, stroke=1)

                                # Draw label text beside the checkbox
                                label = field.get('label', '')
                                if label:
                                    can.setFont("Helvetica", font_size)
                                    can.setFillColorRGB(0, 0, 0)
                                    label_x = box_x + box_size + 4
                                    label_y = box_y + (box_size - font_size) / 2 + 1
                                    can.drawString(label_x, label_y, label)

                        
                        can.save()
                        packet.seek(0)
                        
                        # Merge overlay with original page
                        overlay_reader = PdfReader(packet)
                        page.merge_page(overlay_reader.pages[0])
                    
                    writer.add_page(page)
                
                # Add certificate page at the end
                cert_page = self._create_certificate_page(
                    procedure_name, patient_name, signed_date, 
                    certificate_hash, document_id, signature_base64,
                    ip_address, phone_number
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
            certificate_hash, document_id, signature_base64,
            ip_address, phone_number
        )
        can.save()
        packet.seek(0)
        
        with open(filepath, 'wb') as f:
            f.write(packet.read())
        
        print(f"✅ Signed PDF certificate generated: {filepath}")
        return str(filepath)
    
    def _create_certificate_page(
        self, procedure_name: str, patient_name: str, signed_date: datetime,
        certificate_hash: str, document_id: str, signature_base64: str,
        ip_address: Optional[str] = None, phone_number: Optional[str] = None
    ):
        """Create a certificate page as a PdfReader page"""
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        self._draw_certificate_content(
            can, procedure_name, patient_name, signed_date,
            certificate_hash, document_id, signature_base64,
            ip_address, phone_number
        )
        can.save()
        packet.seek(0)
        reader = PdfReader(packet)
        return reader.pages[0]
    
    def _create_certificate_page_canvas(
        self, procedure_name: str, patient_name: str, signed_date: datetime,
        certificate_hash: str, document_id: str, signature_base64: str,
        ip_address: Optional[str] = None, phone_number: Optional[str] = None
    ) -> io.BytesIO:
        """Create a certificate page and return as BytesIO"""
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        self._draw_certificate_content(
            can, procedure_name, patient_name, signed_date,
            certificate_hash, document_id, signature_base64,
            ip_address, phone_number
        )
        can.save()
        packet.seek(0)
        return packet
    
    def _draw_certificate_content(
        self, can: canvas.Canvas, procedure_name: str, patient_name: str,
        signed_date: datetime, certificate_hash: str, document_id: str,
        signature_base64: str, ip_address: Optional[str] = None,
        phone_number: Optional[str] = None
    ):
        """Draw certificate content on a canvas — Section 63/65B (BSA 2023) compliant"""
        from datetime import timezone, timedelta
        width, height = letter
        IST = timezone(timedelta(hours=5, minutes=30))
        ist_signed = signed_date.replace(tzinfo=timezone.utc).astimezone(IST) if signed_date.tzinfo is None else signed_date.astimezone(IST)
        ist_str = ist_signed.strftime('%d-%m-%Y %H:%M:%S IST')
        ist_generated = datetime.now(IST).strftime('%d-%m-%Y %H:%M:%S IST')
        
        # ─── Header ───
        can.setStrokeColorRGB(0.15, 0.25, 0.55)
        can.setLineWidth(2)
        can.rect(30, height - 60, width - 60, 40, stroke=1, fill=0)
        can.setFillColorRGB(0.15, 0.25, 0.55)
        can.setFont("Helvetica-Bold", 16)
        can.drawCentredString(width / 2, height - 47, "ELECTRONIC RECORD CERTIFICATE")
        
        # Sub-header — legal reference 
        can.setFillColorRGB(0.3, 0.3, 0.3)
        can.setFont("Helvetica", 8)
        can.drawCentredString(width / 2, height - 70, "Under Section 63 & 65B of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)")
        can.drawCentredString(width / 2, height - 80, "Read with Section 3A of the Information Technology Act, 2000")
        
        # ─── Document Details ───
        y = height - 110
        can.setFillColorRGB(0, 0, 0)
        can.setFont("Helvetica-Bold", 11)
        can.drawString(50, y, "1. DOCUMENT DETAILS")
        can.setLineWidth(0.5)
        can.line(50, y - 3, width - 50, y - 3)
        
        y -= 20
        details = [
            ("Document:", procedure_name),
            ("Signed by:", patient_name),
            ("Date & Time (IST):", ist_str),
            ("IP Address:", ip_address or "Not captured"),
            ("Verified Phone:", phone_number or "Not captured"),
            ("Document ID:", document_id),
        ]
        for label, value in details:
            can.setFont("Helvetica-Bold", 9)
            can.drawString(60, y, label)
            can.setFont("Helvetica", 9)
            can.drawString(190, y, str(value))
            y -= 16
        
        # ─── Signature ───
        y -= 10
        can.setFont("Helvetica-Bold", 11)
        can.drawString(50, y, "2. ELECTRONIC SIGNATURE")
        can.line(50, y - 3, width - 50, y - 3)
        y -= 10
        
        try:
            signature_data = signature_base64.split(',')[1] if ',' in signature_base64 else signature_base64
            signature_bytes = base64.b64decode(signature_data)
            signature_image = Image.open(io.BytesIO(signature_bytes))
            temp_sig = io.BytesIO()
            signature_image.save(temp_sig, format='PNG')
            temp_sig.seek(0)
            sig_width, sig_height = 250, 100
            x_pos = (width - sig_width) / 2
            can.drawImage(ImageReader(temp_sig), x_pos, y - sig_height - 5, width=sig_width, height=sig_height, preserveAspectRatio=True, mask='auto')
            y -= sig_height + 15
        except Exception as e:
            print(f"⚠️ Error adding signature image: {e}")
            can.setFont("Helvetica", 9)
            can.drawString(60, y - 20, "[Signature image could not be rendered]")
            y -= 30
        
        # ─── Cryptographic Hash ───
        y -= 10
        can.setFont("Helvetica-Bold", 11)
        can.setFillColorRGB(0, 0, 0)
        can.drawString(50, y, "3. CRYPTOGRAPHIC VERIFICATION")
        can.line(50, y - 3, width - 50, y - 3)
        y -= 18
        can.setFont("Helvetica-Bold", 9)
        can.drawString(60, y, "SHA-256 Hash:")
        can.setFont("Courier", 7)
        can.drawString(160, y, certificate_hash[:32])
        y -= 12
        can.drawString(160, y, certificate_hash[32:])
        y -= 18
        can.setFont("Helvetica", 8)
        can.setFillColorRGB(0.3, 0.3, 0.3)
        can.drawString(60, y, "This hash uniquely identifies the document contents at the time of signing.")
        can.drawString(60, y - 11, "Any modification to this document will produce a different hash, proving tampering.")
        
        # ─── Section 65B Declaration ───
        y -= 35
        can.setFillColorRGB(0, 0, 0)
        can.setFont("Helvetica-Bold", 11)
        can.drawString(50, y, "4. CERTIFICATE UNDER SECTION 65B, BSA 2023")
        can.line(50, y - 3, width - 50, y - 3)
        y -= 18
        
        # Draw bordered declaration box
        decl_lines = [
            "I hereby certify that:",
            "",
            "(a) This electronic record was produced by the WizeSign system during the ordinary",
            "    course of its regular operation, for the purpose of recording medical consent.",
            "",
            "(b) The information contained in this electronic record was supplied to the system",
            "    in the ordinary course of its operation by the person named above.",
            "",
            "(c) At the time of creation of this electronic record, the computer system was",
            "    operating properly and was not subject to any defect or malfunction.",
            "",
            "(d) The electronic record faithfully and accurately reproduces the information",
            "    supplied to it, including the electronic signature.",
            "",
            f"Certificate generated on: {ist_generated}",
            f"System: WizeSign Electronic Consent Platform",
        ]
        
        box_height = len(decl_lines) * 11 + 10
        can.setStrokeColorRGB(0.5, 0.5, 0.5)
        can.setLineWidth(0.5)
        can.rect(55, y - box_height - 2, width - 110, box_height + 5, stroke=1, fill=0)
        
        can.setFont("Helvetica", 8)
        can.setFillColorRGB(0.1, 0.1, 0.1)
        for line in decl_lines:
            can.drawString(65, y, line)
            y -= 11
        
        # ─── Footer ───
        can.setFont("Helvetica", 7)
        can.setFillColorRGB(0.5, 0.5, 0.5)
        can.drawString(50, 50, f"Document ID: {document_id}")
        can.drawString(50, 40, f"Generated: {ist_generated}")
        can.drawString(50, 30, "This certificate is auto-generated and does not require a physical signature.")
        can.drawRightString(width - 50, 50, "Powered by WizeSign")
        can.drawRightString(width - 50, 40, "Compliant with IT Act 2000 & BSA 2023")
    
    def get_download_path(self, document_id: str) -> Optional[Path]:
        """Get the path to a signed PDF if it exists"""
        filename = f"signed_{document_id}.pdf"
        filepath = self.storage_path / filename
        return filepath if filepath.exists() else None


# Singleton instance
pdf_generator_service = PDFGeneratorService()
