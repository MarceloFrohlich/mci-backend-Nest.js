import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async enviarCodigoRecuperacao(destinatario: string, nome: string, codigo: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Recuperação de Senha — MCI 2.0</h2>
        <p>Olá, <strong>${nome}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Use o código abaixo para concluir o processo. Ele é válido por <strong>15 minutos</strong>.</p>
        <div style="
          background: #f4f4f4;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 24px 0;
        ">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">
            ${codigo}
          </span>
        </div>
        <p style="color: #666; font-size: 13px;">
          Se você não solicitou a recuperação de senha, ignore este e-mail. Sua senha permanece a mesma.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">MCI 2.0 — Sistema de Rastreamento de Metas Corporativas</p>
      </div>
    `;

    const { error } = await this.resend.emails.send({
      from: process.env.MAIL_FROM ?? 'MCI 2.0 <onboarding@resend.dev>',
      to: [destinatario],
      subject: `${codigo} — Código de recuperação de senha MCI 2.0`,
      html,
    });

    if (error) {
      this.logger.error(`Falha ao enviar e-mail para ${destinatario}: ${JSON.stringify(error)}`);
      throw new Error(error.message);
    }
  }
}
