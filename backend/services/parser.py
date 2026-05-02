import io
from pdfminer.high_level import extract_text
import docx

def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    try:
        text = extract_text(io.BytesIO(file_bytes))
        return text
    except Exception as e:
        return f"Error parsing PDF: {str(e)}"

def parse_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        return f"Error parsing DOCX: {str(e)}"

def parse_resume(file_bytes: bytes, filename: str) -> str:
    """Determine file type and parse accordingly."""
    if filename.endswith(".pdf"):
        return parse_pdf(file_bytes)
    elif filename.endswith(".docx"):
        return parse_docx(file_bytes)
    else:
        # Assume plain text if unknown
        return file_bytes.decode("utf-8", errors="ignore")
