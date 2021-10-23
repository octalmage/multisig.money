import type { NextPage } from 'next'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import LineAlert from 'components/LineAlert'
import cloneDeep from 'lodash.clonedeep'
import { useConnectedWallet } from '@terra-money/wallet-provider'
import { MsgExecuteContract } from '@terra-money/terra.js'

interface FormElements extends HTMLFormControlsCollection {
  label: HTMLInputElement
  description: HTMLInputElement
  json: HTMLInputElement
}

interface ProposalFormElement extends HTMLFormElement {
  readonly elements: FormElements
}

function validateJsonSendMsg(json: any, multisigAddress: string) {
  if (typeof json !== 'object') {
    return false
  }
  if (Array.isArray(json)) {
    return false
  }
  const messages = json?.body?.messages || []
  if (messages.length !== 1) {
    return false
  }
  const [message] = messages
  if (message['@type'] !== '/cosmos.bank.v1beta1.MsgSend') {
    return false
  }
  if (message.from_address !== multisigAddress) {
    return false
  }
  return true
}

const ProposalCreate: NextPage = () => {
  const router = useRouter()
  const multisigAddress = (router.query.multisigAddress || '') as string
  const { walletAddress, signingClient } = useSigningClient()
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [proposalID, setProposalID] = useState('')
  const connectedWallet = useConnectedWallet()

  const handleSubmit = (event: FormEvent<ProposalFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const currentTarget = event.currentTarget as ProposalFormElement

    const title = currentTarget.label.value.trim()
    const description = currentTarget.description.value.trim()
    const jsonStr = currentTarget.json.value.trim()

    if (
      title.length === 0 ||
      description.length === 0 ||
      jsonStr.length === 0
    ) {
      setLoading(false)
      setError('All fields are required.')
    }

    // clone json string to avoid prototype poisoning
    // https://medium.com/intrinsic-blog/javascript-prototype-poisoning-vulnerabilities-in-the-wild-7bc15347c96
    const jsonClone = cloneDeep(jsonStr);
    const json = JSON.parse(jsonClone)
    const msgs = Array.isArray(json) ? json : [json];

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
    );

    connectedWallet
      ?.post({
        msgs: [execute],
      })
      .then((response) => {
        console.log(response);
        setTransactionHash(response.result.txhash)
      })
      .catch((err) => {
        console.log(err);
        setLoading(false)
        setError(err.message)
      })

    // signingClient
    //   ?.execute(walletAddress, multisigAddress, { propose: msg })
    //   .then((response) => {
    //     setLoading(false)
    //     setTransactionHash(response.transactionHash)
    //     const [{ events }] = response.logs
    //     const [wasm] = events.filter((e) => e.type === 'wasm')
    //     const [{ value }] = wasm.attributes.filter(
    //       (w) => w.key === 'proposal_id'
    //     )
    //     setProposalID(value)
    //   })
    //   .catch((e) => {
    //     setLoading(false)
    //     setError(e.message)
    //   })
  }

  const complete = transactionHash.length > 0

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
            <label className="block mt-4">JSON</label>
            <textarea
              className="input input-bordered rounded box-border p-3 w-full font-mono h-80 focus:input-primary text-x"
              cols={7}
              name="json"
              readOnly={complete}
            />
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
