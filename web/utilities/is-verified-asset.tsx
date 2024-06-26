import type { DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api';

/* The owner must be the author and also a verified creator
   Other creators can be unverified
*/
export const isVerifiedAsset = (asset: DasApiAsset): boolean => {
  const owner = asset.ownership.owner;
  return asset.creators.some(
    (creator) => creator.address === owner && creator.verified === true,
  );
};
