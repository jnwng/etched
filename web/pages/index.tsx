import MarkdownProcessor from '@/components/processed-markdown';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';

export const getStaticProps = () => {
  const homepageContent = fs.readFileSync(path.join(process.cwd(), 'components/homepage.md'), 'utf8');

  return {
    props: {
      homepageContent,
    },
  };
};

export default function Home({ homepageContent }: { homepageContent: string }) {
  return (
    <div>
      <Head>
        <title>Welcome to Etched</title>
        <meta name="description" content="Welcome to our Next.js application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="hero min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <MarkdownProcessor markdown={homepageContent} />
          </div>
        </div>
      </div>

    </div>
  );
}