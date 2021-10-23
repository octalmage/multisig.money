import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSigningClient } from 'contexts/cosmwasm'

function ContractLabel() {
  const router = useRouter()
  const multisigAddress = (router.query.multisigAddress || '') as string
  const { signingClient } = useSigningClient()
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (multisigAddress.length === 0 || !signingClient) {
      setLabel('')
      return
    }

    signingClient.getContract(multisigAddress).then((response) => {
      setLabel(response.label)
    })
  }, [multisigAddress, signingClient])

  if (label.length === 0) {
    return null
  }

  return (
    <div className="flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="inline-block w-6 h-6 mx-2 stroke-current"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 5l7 7-7 7"
        ></path>
      </svg>
      <Link href={`/${encodeURIComponent(multisigAddress)}`}>
        <a className="capitalize hover:underline text-2xl">{label}</a>
      </Link>
    </div>
  )
}

export default ContractLabel
