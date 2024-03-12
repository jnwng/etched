import React, { useState, useEffect } from 'react';
import { RouteType } from '@/pages/[address]';
import { DASAsset, isVerifiedNft } from '@/utilities/is-verified-nft';
import { getDomainKeySync, NameRegistryState } from '@bonfida/spl-name-service';
import { Connection, PublicKey } from '@solana/web3.js';

type BlogListProps = {
  address: string;
  routeType: RouteType;
};

const BlogList = ({ address, routeType }: BlogListProps) => {
  const [blogs, setBlogs] = useState<Array<DASAsset & { verified: boolean }>>([]);

  useEffect(() => {
    const getAssetsByCreator = async () => {
      let author = address;
      if (routeType === RouteType.Shortname) {
        const connection = new Connection(process.env.NEXT_PUBLIC_MAINNET_HELIUS_ENDPOINT!)
        const registryKey = getDomainKeySync(address);
        const { registry, nftOwner } = await NameRegistryState.retrieve(
          connection,
          registryKey.pubkey,
        );
        console.log({ nftOwner, registry })
        author = registry.owner.toString();
        console.info("Resolving", { author })
      }

      const response = await fetch(process.env.NEXT_PUBLIC_DEVNET_HELIUS_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'etched-archive',
          method: 'getAssetsByCreator',
          params: {
            creatorAddress: author,
            onlyVerified: true,
            page: 1, // Starts at 1
            limit: 1000
          },
        }),
      });
      const { result } = await response.json();
      console.log("Assets by Creator: ", result.items);

      const verifiedBlogs = (result.items as DASAsset[]).filter(item => {
        return isVerifiedNft(item, author);
      }).map(asset => ({
        ...asset,
        verified: true
      }))
      setBlogs(verifiedBlogs)
    };
    if (address) {
      getAssetsByCreator();
    }

  }, [address, routeType]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Address: {address}</h2>
      <div>
        {blogs.filter(blog => blog.verified).map((blog, index) => (
          <a href={`/${blog.id}`} key={index} className="p-4 mb-4 border rounded block">
            <h3 className="text-xl font-semibold">{blog.content.metadata.name}</h3>
          </a>
        ))}
      </div>
    </div>
  );
};

export default BlogList;
