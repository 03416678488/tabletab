import { baseLayout, greeting, paragraph, button, note, supportLine } from './_base-layout';

export const EmailVerificationSuccessTemplate = (name: string, appUrl: string): string => {
  const body = `
    ${greeting(name)}
    ${paragraph(`Your email is verified and your account is fully active. You're ready to go.`)}
    ${button('Open dashboard', appUrl)}
    ${note(`Tip: enable two-factor authentication in your account settings for an extra layer of security.`)}
    ${supportLine()}
  `;

  return baseLayout({
    title: 'Email verified',
    preheader: 'Your SniffCampaign account is now active.',
    body,
    appUrl,
    footerNote: 'You received this email because your email address was verified.',
  });
};
