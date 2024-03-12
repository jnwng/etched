export type DASAsset = {
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

export const isVerifiedNft = (asset: DASAsset, author: string) => {
  const isVerified = (asset.ownership.owner === author) && asset.creators.some(creator => creator.address === author && creator.verified)
  return isVerified
}