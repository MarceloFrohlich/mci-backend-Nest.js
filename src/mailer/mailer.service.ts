import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT ?? 587),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async enviarCodigoRecuperacao(destinatario: string, nome: string, codigo: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Recuperação de Senha — MCI</h2>
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
        <p style="color: #999; font-size: 12px;">MCI — Sistema de Rastreamento de Metas Corporativas</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"MCI Sistema" <${process.env.MAIL_FROM ?? process.env.MAIL_USER}>`,
        to: destinatario,
        subject: `${codigo} — Código de recuperação de senha MCI`,
        html,
      });
    } catch (erro) {
      this.logger.error(`Falha ao enviar e-mail para ${destinatario}: ${erro}`);
      throw erro;
    }
  }
}
