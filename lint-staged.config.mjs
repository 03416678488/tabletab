/**
 * Repo-root lint-staged config for this multi-project git repo (api + client).
 *
 * Staged files are dispatched to each project's OWN ESLint/Prettier, run with
 * that project's directory as cwd (`bash -c 'cd <proj> && …'`) so its config
 * (flat config for the Next.js client, .eslintrc.js for the NestJS api) and its
 * node_modules resolve correctly. File paths from lint-staged are absolute, so
 * they still resolve after the cd.
 */

const quote = (files) => files.map((f) => `"${f}"`).join(" ");
const inDir = (dir, cmd, files) => `bash -c 'cd ${dir} && ${cmd} ${quote(files)}'`;

export default {
  // Next.js client — Prettier (format) then ESLint (--fix).
  "client/**/*.{ts,tsx,js,jsx}": (files) => [
    inDir("client", "npx prettier --write", files),
    inDir("client", "npx eslint --fix", files),
  ],
  "client/**/*.{json,css,md}": (files) => [inDir("client", "npx prettier --write", files)],

  // NestJS api — Prettier (format) then ESLint (--fix).
  "api/**/*.ts": (files) => [
    inDir("api", "npx prettier --write", files),
    inDir("api", "npx eslint --fix", files),
  ],
};
