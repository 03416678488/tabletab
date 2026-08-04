import { baseLayout, greeting, paragraph, codeBlock, note, supportLine } from './_base-layout';

export const PasswordResetCodeTemplate = (
  name: string,
  resetCode: string,
  expiresInMinutes: number = 15,
  appUrl: string,
): string => {
  const body = `
    ${greeting(name)}
    ${paragraph(`We received a request to reset your password. Use the code below to set a new one.`)}
    ${codeBlock(resetCode, expiresInMinutes, 'Reset code')}
    ${note(`If you didn't request this, you can ignore this email — your password won't change. If you're seeing repeated requests, please <a href="${appUrl}/contact-support" style="color:#115e44;">contact support</a>.`)}
    ${supportLine()}
  `;

  return baseLayout({
    title: 'Reset your password',
    preheader: `Your reset code is ${resetCode}. Expires in ${expiresInMinutes} minutes.`,
    body,
    appUrl,
    footerNote: 'You received this email because a password reset was requested.',
  });
};
