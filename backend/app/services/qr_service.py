import io

import qrcode


def generate_qr_png(data: str) -> bytes:
    """Renders a QR code for the given short URL as PNG bytes. Kept as a
    pure function with no DB/cache access — cheap enough to generate
    on-demand per request, so it never needs to sit on the redirect path or
    be precomputed at create time.
    """
    img = qrcode.make(data)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
