from pypdf import PdfReader
from bs4 import BeautifulSoup
import httpx

def extract_pdf(stream):
    reader = PdfReader(stream)
    return "\n".join(page.extract_text() or "" for page in reader.pages)

async def extract_web(url: str):
    if not url.startswith(("https://", "http://")):
        raise ValueError("URL must start with http:// or https://")
    async with httpx.AsyncClient(timeout=15, follow_redirects=True,
                                 headers={"User-Agent":"CURSORFLOW/1.0 accessibility reader"}) as client:
        response = await client.get(url)
        response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()
    return soup.get_text("\n", strip=True)[:24000]
