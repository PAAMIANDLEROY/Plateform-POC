import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from core.config import settings

logger = logging.getLogger(__name__)


def _send(to_email: str, subject: str, html: str) -> None:
    if not settings.SMTP_HOST:
        logger.info("[EMAIL] To: %s | Subject: %s\n%s", to_email, subject, html)
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)


def send_otp_email(to_email: str, code: str) -> None:
    subject = f"{code} — votre code Hi! Platform"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:12px;">
      <h2 style="color:#fff;margin-bottom:8px;">Hi! Platform</h2>
      <p style="color:#aaa;margin-bottom:32px;">Votre code de connexion</p>

      <div style="background:#111;border:1px solid #333;border-radius:10px;padding:28px;text-align:center;margin-bottom:24px;">
        <p style="color:#aaa;font-size:13px;margin-bottom:12px;">Code à 6 chiffres</p>
        <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#fff;font-family:monospace;">
          {code}
        </div>
      </div>

      <p style="color:#666;font-size:13px;text-align:center;">
        Ce code expire dans <strong style="color:#aaa;">10 minutes</strong>.<br>
        Si vous n'avez pas demandé ce code, ignorez cet email.
      </p>
    </div>
    """
    _send(to_email, subject, html)
