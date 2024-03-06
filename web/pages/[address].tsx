import ReactMarkdown from 'react-markdown';
import env from '../components/env';

// TODO(jon): Add some caching
export async function getServerSideProps({ params: { address } }: { params: { address: string } }) {
  // TODO(jon): Switch this endpoint based on environment / subdomain
  const res = await fetch(env.DEVNET_HELIUS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAsset",
      params: [address],
    }),
  });
  const data = await res.json();

  const contentRes = await fetch(data.result.content.json_uri);
  const { description } = await contentRes.json();

  // Directly pass markdown content to the component
  return {
    props: {
      contentMarkdown: description,
    },
  };
}

function SolanaMarkdown({ contentMarkdown }: { contentMarkdown: string }) {
  return <ReactMarkdown>{contentMarkdown}</ReactMarkdown>;
}

export default SolanaMarkdown;