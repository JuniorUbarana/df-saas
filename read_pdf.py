import sys
try:
    from pypdf import PdfReader
except ImportError:
    print("pypdf not installed.")
    sys.exit(1)

def extract_text(pdf_path, out_path):
    try:
        reader = PdfReader(pdf_path)
        with open(out_path, "w", encoding="utf-8") as f:
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    f.write(text + "\n")
        print("Done")
    except Exception as e:
        print(f"Error reading PDF: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python read_pdf.py <pdf_path> <out_path>")
        sys.exit(1)
    extract_text(sys.argv[1], sys.argv[2])
