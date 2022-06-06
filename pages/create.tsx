import type { NextPage } from 'next'
import { FormEvent, useMemo } from 'react'
import WalletLoader from 'components/WalletLoader'
import { useState } from 'react'
import { useRouter } from 'next/router'
import LineAlert from 'components/LineAlert'
import { InstantiateMsg, Voter } from 'types/cw3'
import { MsgInstantiateContract, LCDClient } from '@terra-money/terra.js'
import { useConnectedWallet, useWallet } from '@terra-money/wallet-provider'

const MULTISIG_CODE_ID = 595;
const MULTISIG_CODE_ID_TESTNET = 15690;

function AddressRow({ idx, readOnly }: { idx: number; readOnly: boolean }) {
  return (
    <tr key={idx}>
      <td className="pr-2 pb-2">
        <input
          className="block box-border m-0 w-full rounded input input-bordered focus:input-primary font-mono"
          type="text"
          name={`address_${idx}`}
          placeholder="wallet address..."
          size={45}
          readOnly={readOnly}
        />
      </td>
      <td className="pb-2">
        <input
          type="number"
          className="block box-border m-0 w-full rounded input input-bordered focus:input-primary font-mono"
          name={`weight_${idx}`}
          defaultValue="1"
          min={1}
          max={999}
          readOnly={readOnly}
        />
      </td>
    </tr>
  )
}

function validateNonEmpty(msg: InstantiateMsg) {
  const { required_weight, max_voting_period, voters } = msg
  if (isNaN(required_weight) || isNaN(max_voting_period.time)) {
    return false
  }
  if (
    voters.some(({ addr, weight }: Voter) => addr.length === 0 || isNaN(weight))
  ) {
    return false
  }
  return true
}

interface FormElements extends HTMLFormControlsCollection {
  duration: HTMLInputElement
  threshold: HTMLInputElement
  label: HTMLInputElement
  [key: string]: any
}

interface MultisigFormElement extends HTMLFormElement {
  readonly elements: FormElements
}

const CreateMultisig: NextPage = () => {
  const router = useRouter()
  const [count, setCount] = useState(2)
  const [contractAddress, setContractAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const connectedWallet = useConnectedWallet()
  const { post } = useWallet()

  const lcd = useMemo(() => {
    if (!connectedWallet) {
      return null
    }

    return new LCDClient({
      URL: connectedWallet.network.lcd,
      chainID: connectedWallet.network.chainID,
      isClassic: true,
    })
  }, [connectedWallet])

  const handleSubmit = (event: FormEvent<MultisigFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const formEl = event.currentTarget as MultisigFormElement

    const voters = [...Array(count)].map((_item, index) => ({
      addr: formEl[`address_${index}`]?.value?.trim(),
      weight: parseInt(formEl[`weight_${index}`]?.value?.trim()),
    }))
    const required_weight = parseInt(formEl.threshold.value?.trim())
    const max_voting_period = {
      time: parseInt(formEl.duration.value?.trim()),
    }

    const msg = {
      voters,
      required_weight,
      max_voting_period,
    }
    // @ebaker TODO: add more validation
    if (!validateNonEmpty(msg)) {
      setLoading(false)
      setError('All fields are required.')
      return
    }

    const execute = new MsgInstantiateContract(
      connectedWallet?.walletAddress.toString() || '',
      connectedWallet?.walletAddress.toString() || '',
      connectedWallet?.network.name === 'testnet'
        ? MULTISIG_CODE_ID_TESTNET
        : MULTISIG_CODE_ID,
      msg,
      {}
    )

    post({
      msgs: [execute],
    })
      .then(response => response.result.txhash)
      .then(async (txhash) => {
        if (!lcd) return;

        for (let i = 0; i <= 50; i += 1) {
          // query txhash
          try {
            const data = await lcd.tx.txInfo(txhash)
            if (data) return data
          } catch (e) {
            // NOOP
          }

          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      })
      .then((result) => {
        if (result && result.logs) {
          const address = result.logs[0].eventsByType.instantiate_contract.contract_address[0];
          setContractAddress(address);
        }

        setLoading(false)
      })
      .catch((err) => {
        setLoading(false)
        setError(err.message)
      })
  }

  const complete = contractAddress.length > 0

  return (
    <WalletLoader>
      <div className="text-center container mx-auto max-w-lg">
        <h1 className="text-5xl font-bold mb-8">New Multisig</h1>
        <form
          className="container mx-auto max-w-lg mb-8"
          onSubmit={handleSubmit}
        >
          <table className="w-full mb-8">
            <thead>
              <tr>
                <th>Address</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(count)].map((_item, index) => (
                <AddressRow key={index} idx={index} readOnly={complete} />
              ))}
              <tr>
                <td colSpan={2} className="text-right">
                  <button
                    className="btn btn-outline btn-primary btn-md text-md rounded-full"
                    onClick={(e) => {
                      e.preventDefault()
                      setCount(count + 1)
                    }}
                  >
                    + Add another
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full my-4">
            <thead>
              <tr>
                <th className="text-left">Threshold</th>
                <th className="text-left box-border px-2 text-sm">
                  Max Voting Period (seconds)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    className="block box-border m-0 w-full rounded input input-bordered focus:input-primary"
                    name="threshold"
                    type="number"
                    defaultValue={count}
                    min={1}
                    max={999}
                    readOnly={complete}
                  />
                </td>
                <td className="box-border px-2">
                  <input
                    className="block box-border m-0 w-full rounded input input-bordered focus:input-primary"
                    name="duration"
                    type="number"
                    placeholder="duration in seconds"
                    min={1}
                    max={2147483647}
                    defaultValue={604800}
                    readOnly={complete}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          {!complete && (
            <button
              className={`btn btn-primary btn-lg font-semibold hover:text-base-100 text-2xl rounded-full w-full ${
                loading ? 'loading' : ''
              }`}
              style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
              type="submit"
              disabled={loading}
            >
              Create Multisig
            </button>
          )}
        </form>

        {error && <LineAlert variant="error" msg={error} />}

        {contractAddress !== '' && (
          <div className="text-right">
            <LineAlert variant="success" msg={`Success!`} />
            <button
              className="mt-4 box-border px-4 py-2 btn btn-primary"
              onClick={(e) => {
                e.preventDefault()
                router.push(`/${encodeURIComponent(contractAddress)}`)
              }}
            >
              View Multisig &#8599;
            </button>
          </div>
        )}
      </div>
    </WalletLoader>
  )
}

export default CreateMultisig
