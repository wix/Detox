import fs from 'fs';

import dictionary_en from 'dictionary-en';
import remark_frontmatter from 'remark-frontmatter';
import remark_gfm from 'remark-gfm';
import remark_github from 'remark-github';
import remark_retext from 'remark-retext';
import remark_validate_links from 'remark-validate-links';
import retext_contractions from 'retext-contractions';
import retext_diacritics from 'retext-diacritics';
import retext_english from 'retext-english';
import retext_indefinite_article from 'retext-indefinite-article';
import retext_profanities from 'retext-profanities';
import retext_redundant_acronyms from 'retext-redundant-acronyms';
import retext_repeated_words from 'retext-repeated-words';
import retext_sentence_spacing from 'retext-sentence-spacing';
import retext_spell from 'retext-spell';
import retext_syntax_mentions from 'retext-syntax-mentions';
import retext_syntax_urls from 'retext-syntax-urls';
import {unified} from 'unified';

export default {
  frail: true,
  silentlyIgnore: true,
  settings: {
    bullet: '-',
    bulletOther: '*',
    bulletOrdered: '.',
    closeAtx: false,
    emphasis: '_',
    fence: '`',
    fences: true,
    incrementListMarker: false,
    listItemIndent: 1,
    quote: '"',
    resourceLink: false,
    rule: '-',
    ruleRepetition: 3,
    ruleSpaces: false,
    setext: false,
    strong: '*'
  },
  plugins: [
    [remark_frontmatter, {
      type: 'yaml',
      marker: '-',
    }],
    // GitHub and its flavored markdown integration
    [remark_gfm, {
      tablePipeAlign: true,
    }],
    remark_github,
    // Links integrity.
    remark_validate_links, // TODO: check how to validate footnotes
    // Spelling and style.
    [ remark_retext,
      unified()
        .use(retext_english)
        .use(retext_syntax_mentions)
        .use(retext_syntax_urls)
        .use(retext_spell, {
          dictionary: dictionary_en,
          personal: fs.readFileSync('.retext-spell.dic'),
        })
        .use(retext_contractions)
        .use(retext_diacritics)
        .use(retext_indefinite_article)
        .use(retext_profanities, { sureness: 1, ignore: ['black'] })
        .use(retext_redundant_acronyms)
        .use(retext_repeated_words)
        .use(retext_sentence_spacing)
    ],
  ],
};
