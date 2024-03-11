import React, { useState, useEffect } from 'react';
import type { RouteType } from '@/pages/[address]';

type BlogListProps = {
  address: string;
  routeType: RouteType;
};

type DASAsset = {
  id: string;
  ownership: {
    owner: string,
  },
  creators: { address: string, verified: boolean }[]
  content: {
    metadata: {
      name: string
    }
  }
}

const BlogList = ({ address }: BlogListProps) => {
  const [blogs, setBlogs] = useState<Array<DASAsset & { verified: boolean }>>([]);

  useEffect(() => {
    const getAssetsByCreator = async () => {
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
            creatorAddress: address,
            onlyVerified: true,
            page: 1, // Starts at 1
            limit: 1000
          },
        }),
      });
      const { result } = await response.json();
      console.log("Assets by Creator: ", result.items);

      const verifiedBlogs = (result.items as DASAsset[]).filter(item => {
        const isVerified = (item.ownership.owner === address) && item.creators.some(creator => creator.address === address && creator.verified)
        console.info({ isVerified })
        return isVerified
      }).map(asset => ({
        ...asset,
        verified: true
      }))
      setBlogs(verifiedBlogs)
    };
    if (address) {
      getAssetsByCreator();
    }

  }, [address]);

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
