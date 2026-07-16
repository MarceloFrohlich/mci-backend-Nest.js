import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  private get resend(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY não configurada');
    return new Resend(apiKey);
  }

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

  async enviarConvite(destinatario: string, nome: string, link: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Você foi convidado para o MCI 2.0 🎯</h2>
        <p>Olá, <strong>${nome}</strong>!</p>
        <p>Uma conta foi criada para você no <strong>MCI — Metas Crucialmente Importantes</strong>,
        o sistema de acompanhamento de metas e resultados.</p>
        <p>Para começar, defina a sua senha de acesso clicando no botão abaixo:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${link}" style="
            background: #3477DD;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 24px;
            font-weight: bold;
            display: inline-block;
          ">Definir minha senha</a>
        </div>
        <p style="color: #666; font-size: 13px;">
          Este convite é válido por <strong>2 dias</strong>. Depois desse prazo, será necessário
          solicitar um novo convite ao administrador do sistema.
        </p>
        <p style="color: #666; font-size: 13px;">
          Se o botão não funcionar, copie e cole este endereço no navegador:<br />
          <a href="${link}" style="color: #3477DD; word-break: break-all;">${link}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">MCI 2.0 — Sistema de Rastreamento de Metas Corporativas</p>
      </div>
    `;

    const { error } = await this.resend.emails.send({
      from: process.env.MAIL_FROM ?? 'MCI 2.0 <onboarding@resend.dev>',
      to: [destinatario],
      subject: 'Convite: sua conta no MCI 2.0 está pronta — defina sua senha',
      html,
    });

    if (error) {
      this.logger.error(`Falha ao enviar convite para ${destinatario}: ${JSON.stringify(error)}`);
      throw new Error(error.message);
    }
  }
}
