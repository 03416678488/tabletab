export type ModuleType = 'settings' | 'contacts' | 'groups';

export type ModuleTypesEnum = {
  [key in ModuleType]: string;
} & {
  [key: string]: string;
};
