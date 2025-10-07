import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import MDXContent from '@theme/MDXContent';
import {ThemeClassNames} from '@docusaurus/theme-common';

import Heading from '@theme/Heading';
import styles from './index.module.css';

import LinksContent from '../../docs/mainpage_links.md';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Open Docs 🚀️
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Basic info`}
      description="ParkTrack docs website">
      <HomepageHeader />
        <main>
            <div
                className={clsx(
                    'container',
                    'margin-vert--lg',
                    'padding-vert--lg',
                    'homeDocContainer'
                )}
            >
                <article className={ThemeClassNames.docs.docMarkdown}>
                    <MDXContent>
                        <LinksContent/>
                    </MDXContent>
                </article>
            </div>
        </main>
    </Layout>
  );
}
