import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { base, baseSepolia, sepolia } from "wagmi/chains";
import { baseAccount } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [base, baseSepolia, sepolia],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
      [sepolia.id]: http(),
    },
    connectors: [
      baseAccount({
        // preference: { walletUrl: "http://localhost:3005/connect" },
      }),
    ],
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
