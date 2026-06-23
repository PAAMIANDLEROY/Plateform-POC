import logging

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def _send(to_email: str, subject: str, html: str) -> None:
    """
    Envoie un email via l'API HTTP de Resend (POST /emails, port 443).

    Choix de l'API HTTP plutôt que SMTP : les hébergeurs PaaS gratuits (Render)
    bloquent fréquemment les ports SMTP sortants (465/587), ce qui faisait échouer
    ou pendre l'envoi en silence. Le HTTPS (443) n'est jamais bloqué, et la réponse
    JSON de Resend donne une erreur explicite (loggée en ERROR, donc visible).

    La clé API est lue depuis RESEND_API_KEY, avec fallback sur SMTP_PASSWORD
    (où la clé `re_...` est déjà configurée). Sans clé → log dev, pas d'envoi.
    """
    api_key = settings.RESEND_API_KEY or settings.SMTP_PASSWORD
    if not api_key:
        logger.info("[EMAIL] To: %s | Subject: %s\n%s", to_email, subject, html)
        return

    # From = expéditeur vérifié (EMAIL_FROM). En mode test Resend : onboarding@resend.dev.
    sender = settings.EMAIL_FROM or "onboarding@resend.dev"
    try:
        resp = httpx.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={"from": sender, "to": [to_email], "subject": subject, "html": html},
            timeout=15,
        )
        if resp.status_code >= 400:
            # resp.text contient la raison exacte (domaine non vérifié, destinataire
            # interdit en mode test, clé invalide…) — précieux pour le débogage.
            logger.error("Resend API %s sending to %s: %s", resp.status_code, to_email, resp.text)
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
