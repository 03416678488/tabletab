import { baseLayout, greeting, paragraph, button, note, supportLine } from './_base-layout';

export const PasswordResetSuccessTemplate = (name: string, appUrl: string): string => {
  const body = `
    ${greeting(name)}
    ${paragraph(`Your password was changed successfully. You can sign in with your new password now.`)}
    ${button('Sign in', `${appUrl}/login`)}
    ${note(`Didn't change your password? <a href="${appUrl}/contact-support" style="color:#115e44;">Contact support immediately</a> — your account may be at risk.`)}
    ${supportLine()}
  `;

  return baseLayout({
    title: 'Password changed',
    preheader: 'Your SniffCampaign password was just updated.',
    body,
    appUrl,
    footerNote: 'You received this email because your password was successfully reset.',
  });
};
