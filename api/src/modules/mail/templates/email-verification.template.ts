import { baseLayout, greeting, paragraph, codeBlock, note, supportLine } from './_base-layout';

export const EmailVerificationCodeTemplate = (
  name: string,
  verificationCode: string,
  expiresInMinutes: number = 15,
  appUrl: string,
): string => {
  const body = `
    ${greeting(name)}
    ${paragraph(`Use the code below to verify your email address.`)}
    ${codeBlock(verificationCode, expiresInMinutes, 'Verification code')}
    ${note(`Never share this code. SniffCampaign will never ask for it by email or phone. If you didn't request this, you can ignore this message.`)}
    ${supportLine()}
  `;

  return baseLayout({
    title: 'Your verification code',
    preheader: `Your code is ${verificationCode}. Expires in ${expiresInMinutes} minutes.`,
    body,
    appUrl,
    footerNote: 'You received this email because a verification code was requested.',
  });
};
