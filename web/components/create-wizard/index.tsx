import React, { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import MintTransactionButton from '../create/button'; // Adjust the import path as necessary
import { useWallet } from '@solana/wallet-adapter-react';

type MetadataProps = {
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
};

const MetadataSection: React.FC<MetadataProps> = ({ title, setTitle }) => {
  return (
    <div>
      <label className="flex form-control w-full">
        <div className="label">
          <span className="label-text">Title</span>
          <span className="label-text-alt">Max 32 characters</span>
        </div>
        <input
          type="text"
          className="input input-bordered w-full"
          maxLength={32}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
    </div>
  );
};

const AuthorSection: React.FC = () => {
  return (
    <div>
      <h2>Author</h2>
      <WalletMultiButton className="btn btn-primary mt-4" />
    </div>
  );
};

const WizardPage = ({ markdown }: { markdown: string }) => {
  const [title, setTitle] = useState<string>('');
  const wallet = useWallet();

  return (
    <div className="p-4">
      <MetadataSection title={title} setTitle={setTitle} />
      <div className="my-8">
        <AuthorSection />
      </div>
      <div className="flex justify-center mt-8">
        <MintTransactionButton
          title={title}
          author={wallet.publicKey?.toString() || ''}
          markdown={markdown}
        />
      </div>
    </div>
  );
};

export default WizardPage;
