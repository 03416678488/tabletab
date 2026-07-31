import { baseLayout, greeting, paragraph, button, note, supportLine } from './_base-layout';

export const WelcomeNewCustomerTemplate = (name: string, appUrl: string): string => {
  const body = `
    ${greeting(name)}
    ${paragraph(`Welcome to SniffCampaign. Your account is ready, and you're all set to start building campaigns.`)}
    ${button('Open dashboard', `${appUrl}/onboarding`)}
    ${note(`Most teams send their first campaign within 15 minutes — pick a template, choose an audience, and you're live.`)}
    ${supportLine()}
  `;

  return baseLayout({
    title: 'Welcome to SniffCampaign',
    preheader: 'Your account is ready. Send your first campaign in minutes.',
    body,
    appUrl,
    footerNote: 'You received this email because you signed up for SniffCampaign.',
  });
};
