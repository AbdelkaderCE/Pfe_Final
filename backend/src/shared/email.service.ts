import nodemailer from "nodemailer";
import logger from "../utils/logger";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("fr-FR", options);
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}:`, error);
    throw new Error("Failed to send email");
  }
};

export const sendWelcomeEmail = async (
  email: string,
  nom: string,
  prenom: string,
  tempPassword: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          Bienvenue à l'Université !
        </h1>
        
        <p style="color: #666; font-size: 16px;">
          Bonjour <strong>${prenom} ${nom}</strong>,
        </p>
        
        <p style="color: #666; font-size: 16px;">
          Votre compte a été créé avec succès. Veuillez utiliser les identifiants suivants pour vous connecter :
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
          <p style="color: #666; margin: 10px 0;">
            <strong>Email</strong>: <span style="font-family: monospace;">${email}</span>
          </p>
          <p style="color: #666; margin: 10px 0;">
            <strong>Mot de passe temporaire</strong>: <span style="font-family: monospace;">${tempPassword}</span>
          </p>
          <p style="color: #999; font-size: 13px; margin-top: 15px;">
            ⚠️ Vous devrez changer ce mot de passe lors de votre première connexion.
          </p>
        </div>
        
        <a href="${process.env.APP_BASE_URL}/login" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold;">
          Accéder à la plateforme
        </a>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Si vous avez des questions, veuillez contacter le service d'aide.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          © 2024 École d'Ingénierie. Tous droits réservés.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Bienvenue - Votre compte a été créé",
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  nom: string,
  prenom: string,
  resetLink: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
          Réinitialiser votre mot de passe
        </h1>
        
        <p style="color: #666; font-size: 16px;">
          Bonjour <strong>${prenom} ${nom}</strong>,
        </p>
        
        <p style="color: #666; font-size: 16px;">
          Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer.
        </p>
        
        <a href="${resetLink}" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold;">
          Réinitialiser mon mot de passe
        </a>
        
        <p style="color: #999; font-size: 13px; margin-top: 20px;">
          Ce lien expire dans 1 heure.
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          © 2024 École d'Ingénierie. Tous droits réservés.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Réinitialiser votre mot de passe",
    html,
  });
};

export const sendEmailVerificationEmail = async (
  email: string,
  nom: string,
  prenom: string,
  verificationLink: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          Vérifier votre adresse email
        </h1>
        
        <p style="color: #666; font-size: 16px;">
          Bonjour <strong>${prenom} ${nom}</strong>,
        </p>
        
        <p style="color: #666; font-size: 16px;">
          Merci de vous être inscrit. Cliquez sur le bouton ci-dessous pour vérifier votre adresse email.
        </p>
        
        <a href="${verificationLink}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold;">
          Vérifier mon email
        </a>
        
        <p style="color: #999; font-size: 13px; margin-top: 20px;">
          Ce lien expire dans 24 heures.
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Si vous n'avez pas créé ce compte, ignorez cet email.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          © 2024 École d'Ingénierie. Tous droits réservés.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Vérifier votre adresse email",
    html,
  });
};

export const sendPFEAssignmentEmail = async (
  email: string,
  nom: string,
  prenom: string,
  titre: string,
  dateSoutenance: Date
): Promise<void> => {
  const formattedDate = formatDate(dateSoutenance);

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #333; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">
          Sujet PFE Assigné
        </h1>
        
        <p style="color: #666; font-size: 16px;">
          Bonjour <strong>${prenom} ${nom}</strong>,
        </p>
        
        <p style="color: #666; font-size: 16px;">
          Vous avez été assigné au sujet PFE suivant :
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #17a2b8; margin: 20px 0;">
          <p style="color: #666; margin: 10px 0;">
            <strong>Titre</strong>: ${titre}
          </p>
          <p style="color: #666; margin: 10px 0;">
            <strong>Date de soutenance</strong>: ${formattedDate}
          </p>
        </div>
        
        <a href="${process.env.APP_BASE_URL}/pfe" style="display: inline-block; background-color: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold;">
          Voir les détails
        </a>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Veuillez consulter la plateforme pour les détails complets et les exigences du projet.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          © 2024 École d'Ingénierie. Tous droits réservés.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Sujet PFE assigné",
    html,
  });
};

export const sendDisciplinaryNotificationEmail = async (
  email: string,
  nom: string,
  prenom: string,
  caseName: string,
  dateReunion: Date | null
): Promise<void> => {
  const dateText = dateReunion ? formatDate(dateReunion) : "À planifier";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
          Notification - Cas Disciplinaire
        </h1>
        
        <p style="color: #666; font-size: 16px;">
          Bonjour <strong>${prenom} ${nom}</strong>,
        </p>
        
        <p style="color: #666; font-size: 16px;">
          Vous avez été impliqué dans un cas disciplinaire :
        </p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <p style="color: #856404; margin: 10px 0;">
            <strong>Cas</strong>: ${caseName}
          </p>
          <p style="color: #856404; margin: 10px 0;">
            <strong>Réunion prévue</strong>: ${dateText}
          </p>
        </div>
        
        <a href="${process.env.APP_BASE_URL}/discipline" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold;">
          Accéder aux détails
        </a>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Veuillez consulter la plateforme pour plus d'informations sur ce cas.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          © 2024 École d'Ingénierie. Tous droits réservés.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Notification - Cas disciplinaire",
    html,
  });
};
