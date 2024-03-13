import Head from 'next/head';
import Link from 'next/link';

type CardProps = {
  title: string;
  content: string;
};

const Card: React.FC<CardProps> = ({ title, content }) => (
  <div className="card w-96 bg-base-100 shadow-xl">
    <div className="card-body">
      <h2 className="card-title">{title}</h2>
      <p>{content}</p>
    </div>
  </div>)

export default function Home() {
  return (
    <div>
      <Head>
        <title>Home Page</title>
        <meta name="description" content="Welcome to our Next.js application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="hero min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Welcome to Etched</h1>
            <div className="flex justify-center gap-10 mt-10">
              <div className="flex-1">
                <Card title="Write to your heart's content" content="Write in Markdown in whatever tool you choose" />
              </div>
              <div className="flex-1">
                <Card title="Etch your writing onto the blockchain" content="Your writing is forever yours, no matter what"
                />
              </div>
              <div className="flex-1">
                <Card title="Share your writing on any medium" content="With rich embeds, share your work anywhere you want" />
              </div>
            </div>
            <div className="flex justify-center">
              <p className="mt-10 text-lg">
                Curious about how your writing will look?
                <br />
                <Link href="/EtCH4rC2dBTBSYcoUvP5HKCPuLhi1ThVfSw13VZMMmyj" className="text-blue-500 hover:underline">Click here to preview</Link> a sample.
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}