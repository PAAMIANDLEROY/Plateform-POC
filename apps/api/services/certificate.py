"""
Génération de certificats PDF avec QR code de vérification.
Utilise fpdf2 + qrcode. Fallback HTML si non installé.
"""
import io
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def _qr_bytes(url: str) -> bytes:
    """Génère un QR code PNG en bytes."""
    import qrcode
    import qrcode.image.pure
    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(image_factory=qrcode.image.pure.PyPNGImage)
    buf = io.BytesIO()
    img.save(buf)
    return buf.getvalue()


def generate_certificate_pdf(
    user_name: str,
    course_title: str,
    issued_at: str,
    verification_url: str,
    frontend_url: str = "http://localhost:3000",
) -> bytes:
    """
    Génère un certificat PDF au format A4 paysage.
    Retourne les bytes du PDF.
    """
    try:
        from fpdf import FPDF

        # Formater la date
        try:
            dt = datetime.fromisoformat(issued_at.replace("Z", "+00:00"))
            date_str = dt.strftime("%d %B %Y").lstrip("0")
        except Exception:
            date_str = issued_at[:10]

        full_verify_url = f"{frontend_url}{verification_url}"

        pdf = FPDF(orientation="L", unit="mm", format="A4")
        pdf.add_page()
        pdf.set_auto_page_break(False)

        w, h = 297, 210

        # ── Fond dégradé simulé ───────────────────────────────────────────────
        pdf.set_fill_color(10, 10, 20)
        pdf.rect(0, 0, w, h, "F")

        # ── Bordure décorative ────────────────────────────────────────────────
        pdf.set_draw_color(0, 69, 117)  # primary blue
        pdf.set_line_width(2)
        pdf.rect(8, 8, w - 16, h - 16)
        pdf.set_line_width(0.5)
        pdf.set_draw_color(255, 255, 255, 30)
        pdf.rect(10, 10, w - 20, h - 20)

        # ── En-tête Hi! PARIS ────────────────────────────────────────────────
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(0, 85, 150)
        pdf.set_xy(0, 18)
        pdf.cell(w, 8, "Hi! PARIS — Institut Interdisciplinaire IA & Data", align="C")

        # ── Titre ─────────────────────────────────────────────────────────────
        pdf.set_font("Helvetica", "B", 28)
        pdf.set_text_color(255, 255, 255)
        pdf.set_xy(0, 38)
        pdf.cell(w - 60, 14, "CERTIFICAT DE RÉUSSITE", align="C")

        # ── Décoration ligne ──────────────────────────────────────────────────
        pdf.set_draw_color(0, 69, 117)
        pdf.set_line_width(1.5)
        pdf.line(40, 57, w - 80, 57)

        # ── "Décerné à" ───────────────────────────────────────────────────────
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(180, 180, 200)
        pdf.set_xy(0, 65)
        pdf.cell(w - 60, 8, "Ce certificat est décerné à", align="C")

        # ── Nom ───────────────────────────────────────────────────────────────
        pdf.set_font("Helvetica", "B", 32)
        pdf.set_text_color(255, 255, 255)
        pdf.set_xy(0, 77)
        pdf.cell(w - 60, 16, user_name, align="C")

        # ── "Pour avoir complété" ─────────────────────────────────────────────
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(180, 180, 200)
        pdf.set_xy(0, 98)
        pdf.cell(w - 60, 8, "pour avoir complété avec succès le cours", align="C")

        # ── Titre du cours ────────────────────────────────────────────────────
        pdf.set_font("Helvetica", "B", 18)
        pdf.set_text_color(100, 180, 255)
        pdf.set_xy(0, 110)
        pdf.cell(w - 60, 12, course_title[:60], align="C")

        # ── Date ──────────────────────────────────────────────────────────────
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(150, 150, 170)
        pdf.set_xy(0, 130)
        pdf.cell(w - 60, 8, f"Délivré le {date_str}", align="C")

        # ── Ligne signature ───────────────────────────────────────────────────
        pdf.set_draw_color(80, 80, 100)
        pdf.set_line_width(0.5)
        pdf.line(60, 155, 180, 155)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(120, 120, 140)
        pdf.set_xy(0, 158)
        pdf.cell(w - 60, 6, "Direction des Formations — Hi! PARIS", align="C")

        # ── QR Code ───────────────────────────────────────────────────────────
        try:
            qr_bytes = _qr_bytes(full_verify_url)
            qr_path = "/tmp/cert_qr.png"
            with open(qr_path, "wb") as f:
                f.write(qr_bytes)
            pdf.image(qr_path, x=w - 55, y=20, w=42, h=42)
        except Exception as e:
            logger.warning("QR code generation failed: %s", e)

        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(100, 100, 120)
        pdf.set_xy(w - 58, 63)
        pdf.cell(48, 5, "Vérifier le certificat", align="C")

        # ── Pied de page ──────────────────────────────────────────────────────
        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(80, 80, 100)
        pdf.set_xy(0, h - 18)
        pdf.cell(w, 5, f"Certificat vérifiable : {full_verify_url}", align="C")

        return pdf.output()

    except ImportError:
        logger.warning("fpdf2 non installé — retour certificat HTML")
        return _html_fallback(user_name, course_title, issued_at, verification_url, frontend_url)


def _html_fallback(user_name: str, course_title: str, issued_at: str, verification_url: str, frontend_url: str) -> bytes:
    """Certificat HTML basique si fpdf2 non disponible."""
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Certificat — {course_title}</title>
<style>
  body {{ font-family: Georgia, serif; background: #0a0a14; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
  .cert {{ border: 2px solid #004575; padding: 60px 80px; max-width: 800px; text-align: center; }}
  h1 {{ color: #fff; font-size: 2.5rem; margin-bottom: 0.5rem; }}
  .name {{ font-size: 3rem; color: #fff; margin: 1rem 0; }}
  .course {{ font-size: 1.5rem; color: #64b4ff; margin: 1rem 0; }}
  .date {{ color: #aaa; font-size: 0.9rem; }}
  .verify {{ margin-top: 2rem; font-size: 0.8rem; color: #666; }}
</style></head>
<body><div class="cert">
  <p style="color:#004575;font-size:0.9rem">Hi! PARIS — Institut Interdisciplinaire IA & Data</p>
  <h1>CERTIFICAT DE RÉUSSITE</h1>
  <p style="color:#aaa">Ce certificat est décerné à</p>
  <div class="name">{user_name}</div>
  <p style="color:#aaa">pour avoir complété avec succès le cours</p>
  <div class="course">{course_title}</div>
  <div class="date">Délivré le {issued_at[:10]}</div>
  <div class="verify">Vérification : {frontend_url}{verification_url}</div>
</div></body></html>"""
    return html.encode("utf-8")
