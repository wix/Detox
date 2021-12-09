import preset from './.remarkrc.mjs';
import remark_lint_no_dead_urls from 'remark-lint-no-dead-urls';

export default {
  ...preset,

  plugins: [
    [remark_lint_no_dead_urls, {
      gotOptions: { concurrency: 2 },
      skipUrlPatterns: [/^https:\/\/developer\.android\.com(?:\/.*)?/],
    }]
  ]
};
