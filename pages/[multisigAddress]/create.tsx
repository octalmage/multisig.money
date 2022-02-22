import type { NextPage } from 'next'
import WalletLoader from 'components/WalletLoader'
import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/router'
import LineAlert from 'components/LineAlert'
import cloneDeep from 'lodash.clonedeep'
import { useConnectedWallet } from '@terra-money/wallet-provider'
import { MsgExecuteContract } from '@terra-money/terra.js'
import Select from 'react-select'

const templates = {
  bank: ({
    address,
    denom,
    amount,
  }: {
    address: string
    denom: string
    amount: string
  }) =>
    `[{"bank":{"send":{"to_address":"${address}","amount":[{"denom":"${denom}","amount":"${amount}"}]}}}]`,
  anchorDeposit: ({ amount }: { amount: string }) =>
    `[{"wasm":{"execute":{"contract_addr":"terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s","msg":"eyJkZXBvc2l0X3N0YWJsZSI6e319","funds":[{"denom":"uusd","amount":"${amount}"}]}}}]`,
  anchorWithdraw: ({ amount }: { amount: string }) => {
    const msg = {
      send: {
        amount: amount,
        contract: 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s',
        msg: 'eyJyZWRlZW1fc3RhYmxlIjp7fX0=',
      },
    }

    const encodedMsg = btoa(JSON.stringify(msg))
    return `[{"wasm":{"execute":{"contract_addr":"terra1hzh9vpxhsk8253se0vv5jj6etdvxu3nv8z07zu","msg":"${encodedMsg}","funds":[]}}}]`
  },
  cw20Transfer: ({
    amount,
    contractAddress,
    recipient,
  }: {
    amount: string
    contractAddress: string
    recipient: string
  }) => {
    const msg = {
      transfer: {
        amount: `${amount}`,
        recipient: recipient,
      },
    }
    const encodedMsg = btoa(JSON.stringify(msg))

    return `[{"wasm":{"execute":{"contract_addr":"${contractAddress}","msg":"${encodedMsg}","funds":[]}}}]`
  },
  cw20Send: ({
    amount,
    // decimals,
    contractAddress,
    recipient,
    encodedRecipientMsg,
  }: {
    amount: string
    decimals: string
    contractAddress: string
    recipient: string
    encodedRecipientMsg: string
  }) => {
    const msg = {
      send: {
        amount: amount,
        contract: recipient,
        msg: encodedRecipientMsg,
      },
    }
    const encodedMsg = btoa(JSON.stringify(msg))

    return `[{"wasm":{"execute":{"contract_addr":"${contractAddress}","execute_msg":"${encodedMsg}","funds":[]}}}]`
  },
}

const options = [
  { value: 'bank', label: 'Bank send' },
  { value: 'anchorDeposit', label: 'Anchor deposit' },
  { value: 'anchorWithdraw', label: 'Anchor withdraw' },
  { value: 'cw20Transfer', label: 'CW20 Transfer' },
  { value: 'custom', label: 'Custom' },
]

interface FormElements extends HTMLFormControlsCollection {
  label: HTMLInputElement
  description: HTMLInputElement
  json: HTMLInputElement
}

interface ProposalFormElement extends HTMLFormElement {
  readonly elements: FormElements
}

const ProposalCreate: NextPage = () => {
  const router = useRouter()
  const multisigAddress = (router.query.multisigAddress || '') as string
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('bank')
  const [coins, setCoins] = useState([{ value: 'uluna', label: 'LUNA' }])
  const [proposalID, setProposalID] = useState('')
  const connectedWallet = useConnectedWallet()

  const handleSubmit = (event: FormEvent<ProposalFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const currentTarget = event.currentTarget as ProposalFormElement

    const title = currentTarget.label.value.trim()
    const description = currentTarget.description.value.trim()
    let jsonStr = ''

    if (type === 'custom') {
      jsonStr = currentTarget.json.value.trim()
    } else if (type === 'bank') {
      const address = currentTarget.address.value.trim()
      const denom = currentTarget.denom.value.trim()
      const amount = (
        parseFloat(currentTarget.amount.value.trim()) * 1000000
      ).toString()
      jsonStr = templates['bank']({ address, amount, denom })
    } else if (type === 'anchorDeposit' || type === 'anchorWithdraw') {
      const amount = (
        parseFloat(currentTarget.amount.value.trim()) * 1000000
      ).toString()
      jsonStr = templates[type]({ amount })
    } else if (type === 'cw20Transfer') {
      const recipient = currentTarget.recipient.value.trim()
      const contractAddress = currentTarget.contractAddress.value.trim()
      const decimals = parseInt(currentTarget.decimals.value.trim())
      const amount = (
        parseFloat(currentTarget.amount.value.trim()) *
        10 ** decimals
      ).toString()
      jsonStr = templates['cw20Transfer']({
        contractAddress,
        recipient,
        amount,
      })
    } else if (type === 'cw20Send') {
      const recipient = currentTarget.recipient.value.trim()
      const contractAddress = currentTarget.contractAddress.value.trim()
      const decimals = parseInt(currentTarget.decimals.value.trim())
      const amount = (
        parseFloat(currentTarget.amount.value.trim()) *
        10 ** decimals
      ).toString()
      const encodedRecipientMsg = currentTarget.encodedRecipientMsg.value.trim()
      jsonStr = templates['cw20Send']({
        contractAddress,
        decimals: decimals.toFixed(0),
        recipient,
        amount,
        encodedRecipientMsg,
      })
    }

    if (
      title.length === 0 ||
      description.length === 0 ||
      jsonStr.length === 0
    ) {
      setLoading(false)
      setError('All fields are required.')
      return
    }

    // clone json string to avoid prototype poisoning
    // https://medium.com/intrinsic-blog/javascript-prototype-poisoning-vulnerabilities-in-the-wild-7bc15347c96
    const jsonClone = cloneDeep(jsonStr)
    const json = JSON.parse(jsonClone)
    const msgs = Array.isArray(json) ? json : [json]

    const msg = {
      title,
      description,
      msgs,
    }

    const execute = new MsgExecuteContract(
      connectedWallet?.walletAddress.toString() || '',
      multisigAddress,
      { propose: msg },
      {}
    )

    connectedWallet
      ?.post({
        msgs: [execute],
      })
      .then((response) => {
        setTransactionHash(response.result.txhash)
      })
      .catch((err) => {
        console.log(err)
        setLoading(false)
        setError(err.message)
      })
  }

  const complete = transactionHash.length > 0

  useEffect(() => {
    const fetchCoins = async () => {
      const coins = await (
        await fetch('https://fcd.terra.dev/v1/txs/gas_prices')
      ).json()

      const coinOptions = Object.keys(coins).map((coin) => ({
        value: coin,
        label:
          coin === 'uluna'
            ? 'LUNA'
            : coin.replace('u', '').replace(/.$/, 't').toUpperCase(),
      }))

      setCoins(coinOptions)
    }

    fetchCoins()
  }, [])

  // TODO: Fix this type.
  const selectStyles = {
    option: (provided: any) => ({ ...provided, color: 'black' }),
  }

  return (
    <WalletLoader>
      <div className="flex flex-col w-full">
        <div className="grid bg-base-100 place-items-center">
          <form
            className="text-left container mx-auto max-w-lg"
            onSubmit={handleSubmit}
          >
            <h1 className="text-4xl my-8 text-bold">Create Proposal</h1>
            <label className="block">Title</label>
            <input
              className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
              name="label"
              readOnly={complete}
            />
            <label className="block mt-4">Description</label>
            <textarea
              className="input input-bordered rounded box-border p-3 h-24 w-full focus:input-primary text-xl"
              name="description"
              readOnly={complete}
            />
            <label className="block mt-4 text-bold">Proposal type</label>
            <Select
              onChange={(e) => e && setType(e.value)}
              value={options.find((item) => item.value === type)}
              options={options}
              styles={selectStyles}
            />

            {type === 'bank' && [
              <label key={0} className="block mt-4">
                Receiving address
              </label>,
              <input
                key={1}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="address"
                readOnly={complete}
              />,
              <label key={2} className="block mt-4">
                Amount
              </label>,
              <input
                key={3}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="amount"
                readOnly={complete}
              />,
              <label key={4} className="block mt-4">
                Denom
              </label>,
              <Select
                styles={selectStyles}
                name="denom"
                key={5}
                options={coins}
              />,
            ]}
            {(type === 'anchorDeposit' || type === 'anchorWithdraw') && [
              <label key={0} className="block mt-4">
                Amount
              </label>,
              <input
                key={1}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="amount"
                readOnly={complete}
              />,
            ]}
            {type === 'cw20Transfer' && [
              <label key={0} className="block mt-4">
                CW20 Address
              </label>,
              <input
                key={1}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="contractAddress"
                readOnly={complete}
              />,
              <label key={2} className="block mt-4">
                Decimals
              </label>,
              <input
                key={3}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="decimals"
                readOnly={complete}
              />,
              <label key={4} className="block mt-4">
                Amount
              </label>,
              <input
                key={5}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="amount"
                readOnly={complete}
              />,
              <label key={6} className="block mt-4">
                Recipient
              </label>,
              <input
                key={7}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="recipient"
                readOnly={complete}
              />,
            ]}
            {type === 'cw20Send' && [
              <label key={0} className="block mt-4">
                CW20 Address
              </label>,
              <input
                key={1}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="contractAddress"
                readOnly={complete}
              />,
              <label key={2} className="block mt-4">
                Decimals
              </label>,
              <input
                key={3}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="decimals"
                readOnly={complete}
              />,
              <label key={4} className="block mt-4">
                Amount
              </label>,
              <input
                key={5}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="amount"
                readOnly={complete}
              />,
              <label key={6} className="block mt-4">
                Recipient Contract
              </label>,
              <input
                key={7}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="recipient"
                readOnly={complete}
              />,
              <label key={8} className="block mt-4">
                Encoded Recipient Message (base64-encoded payload of contract execution message)
              </label>,
              <input
                key={9}
                className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
                name="encodedRecipientMsg"
                readOnly={complete}
              />,
            ]}
            {type === 'custom' && [
              <label key={1} className="block mt-4">
                JSON
              </label>,
              <textarea
                key={2}
                className="input input-bordered rounded box-border p-3 w-full font-mono h-80 focus:input-primary text-x"
                cols={7}
                name="json"
                readOnly={complete}
              />,
            ]}
            {!complete && (
              <button
                className={`btn btn-primary text-lg mt-8 ml-auto ${
                  loading ? 'loading' : ''
                }`}
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                type="submit"
                disabled={loading}
              >
                Create Proposal
              </button>
            )}
            {error && (
              <div className="mt-8">
                <LineAlert variant="error" msg={error} />
              </div>
            )}

            {transactionHash && (
              <div className="mt-8 text-right">
                <LineAlert
                  variant="success"
                  msg={`Success! Transaction Hash: ${transactionHash}`}
                />
                <button
                  className="mt-4 box-border px-4 py-2 btn btn-primary"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push(`/${multisigAddress}/`)
                  }}
                >
                  View Proposals &#8599;
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </WalletLoader>
  )
}

export default ProposalCreate
