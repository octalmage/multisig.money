## Preview

<p align="center" width="100%">
    <img alt="cw3-fixed-multisig preview" src="https://i.imgur.com/92xnXyC.gif">
</p>

## Summary

This project creates a web UI around the [CosmWasm/cw-plus](https://github.com/CosmWasm/cw-plus/) [`cw3-fixed-multisig`](https://github.com/CosmWasm/cw-plus/tree/main/contracts/cw3-fixed-multisig) smart contract. Users can:

- Create an instance of `cw3-fixed-multisig` smart contract
- View proposals for a previously instantiated multisig
- Create proposals for sending funds from the multisig
- Vote on proposals created by other users of the multisig
- Execute proposals that have reached sufficient approval vote threshold

## Proposal List UI

The proposal list UI provides icons indicating proposal status:

<img alt="cw3-fixed-multisig-proposal-status-ui table" src="https://i.imgur.com/P5FDDJ8.png">

## Development

This project was bootstrapped with [`next-cosmwasm-keplr-starter`](https://github.com/ebaker/next-cosmwasm-keplr-starter)

```bash
git clone https://github.com/ebaker/cw3-fixed-multisig-dapp
```

First, setup your `.env` file by copying the example:

```bash
cd my-cosmwasm-dapp
cp .env.example .env.local
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

## Requirements

Please ensure you have the [Keplr wallet extension](https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap) installed in your Chrome based browser (Chrome, Brave, etc).

## Learn More

To learn more about Next.js, CosmJS, Keplr, and Tailwind CSS - take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [CosmJS Repository](https://github.com/cosmos/cosmjs) -JavaScript library for Cosmos ecosystem.
- [@cosmjs/cosmwasm-stargate Documentation](https://cosmos.github.io/cosmjs/latest/cosmwasm-stargate/modules.html) - CosmJS CosmWasm Stargate module documentation.
- [Keplr Wallet Documentation](https://docs.keplr.app/api/cosmjs.html) - using Keplr wallet with CosmJS.
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - utility-first CSS framework.
- [DaisyUI Documentation](https://daisyui.com/docs/use) - lightweight component library built on [tailwindcss](https://tailwindcss.com/).

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
