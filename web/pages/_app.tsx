import './global.css';

import type { AppProps } from 'next/app'
import { SolanaProvider } from '../components/solana/solana-provider';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SolanaProvider>
      <Component {...pageProps} />
    </SolanaProvider>
  );
}