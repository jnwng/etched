import { useRouter } from 'next/router';
import Archive from '../components/archive';
import Asset from '../components/asset';
import env from '@/components/env';
import { isVerifiedNft } from '@/utilities/is-verified-nft';

export enum RouteType {
  Shortname = "SHORTNAME",
  Address = "ADDRESS",
  AssetAddress = "ASSET_ADDRESS"
}

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export async function getStaticProps({ params: { address } }: { params: { address: string } }) {

  if (address.includes('.')) {
    // This is a shortname, make a different request
    return { props: { routeType: RouteType.Shortname } };
  }

  // TODO(jon): Switch this endpoint based on environment / subdomain
  const res = await fetch(env.RPC_ENDPOINT, {
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

  if (data.error && data.error.code === -32000) {
    return { props: { routeType: RouteType.Address } }
  }

  // TODO(jon): Figure out the author's shortname
  const { result: { ownership: { owner: author }, content: { metadata: { name } }, compression: { compressed } } } = data;

  const contentRes = await fetch(data.result.content.json_uri);
  const { description, image } = await contentRes.json();

  // Directly pass markdown content to the component
  return {
    props: {
      routeType: RouteType.AssetAddress,
      author,
      nft: {
        address,
        name,
        imageUri: image,
        content: description,
        // createdAt: undefined,
        isVerified: isVerifiedNft(data.result, author),
        isCompressed: compressed,
      }
    },
    revalidate: 60
  };
}

type SolanaMarkdownProps = {
  nft: {
    address: string;
    name: string;
    imageUri: string;
    // createdAt: Date;
    content: string;
    isVerified: boolean;
    isCompressed: boolean;
  };
  author: string;
  routeType: RouteType;
};

const AddressPage = ({ nft, author, routeType }: SolanaMarkdownProps) => {
  const router = useRouter();
  const { address } = router.query;


  if (routeType === RouteType.Address || routeType === RouteType.Shortname) {
    return <Archive address={address as string} routeType={routeType} />
  }

  return (
    <Asset nft={nft} author={author} />
  )
};

export default AddressPage;
