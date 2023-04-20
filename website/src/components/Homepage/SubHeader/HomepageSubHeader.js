import React, { useState, useEffect } from 'react';
import styles from './HomepageSubHeader.module.scss';

const PAT = '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';

const getGithubStarsCount = async () => {
  const url = 'https://api.github.com/repos/wix/Detox';
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${PAT}`
    }
  });
  const repoData = await response.json();
  const starsCount = repoData.stargazers_count;
  return starsCount;
};

const HomepageSubHeader = () => {
  const [githubStarsCount, setGithubStarsCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const starsCount = await getGithubStarsCount();
      setGithubStarsCount(starsCount);
    }

    fetchData();
  }, []);

  return (
    <div className={styles.subHeader}>
      <div className="container">
        <div className="row">
          <div className="col col--4">
            <div className={styles.subText}>
              Follow us on <strong>social networks:</strong>
            </div>
          </div>
          <div className="col col--8 flex-jc-fe">
            <a
              className={styles.discordButton}
              src="../../static/img/join-us-white.svg"
              href="https://discord.gg/CkD5QKheF5"
              target="_blank"></a>
            <div className={styles.twitterFrame}>
              <iframe
                src="https://platform.twitter.com/widgets/follow_button.html?screen_name=detoxe2e&show_screen_name=false&show_count=true&size=l"
                title="Follow Detox on Twitter"
                width="200"
                height="37"></iframe>
            </div>
            <div className={styles.githubLogo}></div>
            <div className={styles.ghTriangle}></div>
            <div className={styles.githubStar}>{githubStarsCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomepageSubHeader;
