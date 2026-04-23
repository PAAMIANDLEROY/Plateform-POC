import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

from core.config import settings

logger = logging.getLogger(__name__)


def send_verification_email(to_email: str, first_name: str, token: str) -> None:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject = "Vérifiez votre adresse email — Hi! Platform"
    html = f"""
    <h2>Bonjour {first_name},</h2>
    <p>Merci de vous être inscrit sur <strong>Hi! Platform</strong>.</p>
    <p>Cliquez sur le lien ci-dessous pour vérifier votre adresse email :</p>
    <p><a href="{verify_url}" style="background:#004575;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">
      Vérifier mon email
    </a></p>
    <p>Ce lien expire dans 24 heures.</p>
    <p>Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
    """

    if not settings.SMTP_HOST:
        logger.info("SMTP not configured — verification link: %s", verify_url)
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
        logger.error("Failed to send verification email to %s: %s", to_email, exc)
