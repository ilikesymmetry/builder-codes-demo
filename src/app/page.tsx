'use client'

import { useConnect, useConnection, useConnectors, useDisconnect, useSendCalls, useCallsStatus } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { zeroAddress } from 'viem'
import { Attribution } from 'ox/erc8021'
import { useState } from 'react'

function App() {
  const connection = useConnection()
  const { connect, status, error } = useConnect()
  const connectors = useConnectors()
  const { disconnect } = useDisconnect()
  const { sendCalls, data: sendCallsId } = useSendCalls()
  const { data: callsStatus } = useCallsStatus({
    id: sendCallsId?.id!,
    query: {
      enabled: !!sendCallsId,
    },
  })

  const [selectedChain, setSelectedChain] = useState<'base' | 'baseSepolia'>('baseSepolia')
  const [attributionType, setAttributionType] = useState<'none' | 'canonical' | 'custom' | 'malformed'>('none')
  const [builderCode, setBuilderCode] = useState('')
  // const [chainId, setChainId] = useState('')
  const [registryAddress, setRegistryAddress] = useState<`0x${string}`>()
  const [rawSuffix, setRawSuffix] = useState('')

  const transactionHash = callsStatus?.receipts?.[0]?.transactionHash

  const handleSendCalls = () => {
    const capabilities: any = {}
    
    if (attributionType === 'canonical') {
      capabilities.dataSuffix = Attribution.toDataSuffix({
        codes: [builderCode]
      })
    } else if (attributionType === 'custom') {
      capabilities.dataSuffix = Attribution.toDataSuffix({
        codes: [builderCode],
        codeRegistryAddress: registryAddress
      })
    } else if (attributionType === 'malformed') {
      capabilities.dataSuffix = rawSuffix
    }

    const chainId = selectedChain === 'base' ? base.id : baseSepolia.id

    sendCalls({
      chainId,
      calls: [
        {
          to: zeroAddress,
          data: '0x',
          value: BigInt(0),
        },
      ],
      ...(attributionType !== 'none' && { capabilities })
    })
  }

  return (
    <>
      <div>
        <h2>Connection</h2>

        <div>
          status: {connection.status}
          <br />
          addresses: {JSON.stringify(connection.addresses)}
          <br />
          chainId: {connection.chainId}
        </div>

        {connection.status === 'connected' && (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>

      <div>
        <h2>Send Calls</h2>
        {connection.status === 'connected' && (
          <>
            <form style={{ marginBottom: '15px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label htmlFor="chain" style={{ display: 'block', marginBottom: '5px' }}>
                  Chain:
                </label>
                <select
                  id="chain"
                  value={selectedChain}
                  onChange={(e) => setSelectedChain(e.target.value as 'base' | 'baseSepolia')}
                  style={{ padding: '5px', minWidth: '200px' }}
                >
                  <option value="baseSepolia">Base Sepolia</option>
                  <option value="base">Base</option>
                </select>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label htmlFor="attribution-type" style={{ display: 'block', marginBottom: '5px' }}>
                  ERC-8021 Attribution:
                </label>
                <select
                  id="attribution-type"
                  value={attributionType}
                  onChange={(e) => setAttributionType(e.target.value as 'none' | 'canonical' | 'custom' | 'malformed')}
                  style={{ padding: '5px', minWidth: '200px' }}
                >
                  <option value="none">None</option>
                  <option value="canonical">Canonical Registry (Schema 0)</option>
                  <option value="custom">Custom Registry (Schema 1)</option>
                  <option value="malformed">Malformed</option>
                </select>
              </div>

              {(attributionType === 'canonical' || attributionType === 'custom') && (
                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="builder-code" style={{ display: 'block', marginBottom: '5px' }}>
                    Builder Code:
                  </label>
                  <input
                    id="builder-code"
                    type="text"
                    value={builderCode}
                    onChange={(e) => setBuilderCode(e.target.value)}
                    style={{ padding: '5px', minWidth: '200px' }}
                  />
                </div>
              )}

              {attributionType === 'custom' && (
                <>
                  {/* <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="chain-id" style={{ display: 'block', marginBottom: '5px' }}>
                      Chain ID:
                    </label>
                    <input
                      id="chain-id"
                      type="text"
                      value={chainId}
                      onChange={(e) => setChainId(e.target.value)}
                      style={{ padding: '5px', minWidth: '200px' }}
                    />
                  </div> */}
                  <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="registry-address" style={{ display: 'block', marginBottom: '5px' }}>
                      Registry Address:
                    </label>
                    <input
                      id="registry-address"
                      type="text"
                      value={registryAddress}
                      onChange={(e) => setRegistryAddress(e.target.value as `0x${string}`)}
                      style={{ padding: '5px', minWidth: '200px' }}
                    />
                  </div>
                </>
              )}

              {attributionType === 'malformed' && (
                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="raw-suffix" style={{ display: 'block', marginBottom: '5px' }}>
                    Raw Suffix:
                  </label>
                  <input
                    id="raw-suffix"
                    type="text"
                    value={rawSuffix}
                    onChange={(e) => setRawSuffix(e.target.value)}
                    style={{ padding: '5px', minWidth: '200px' }}
                  />
                </div>
              )}
            </form>

            <button type="button" onClick={handleSendCalls}>
              Send Calls
            </button>
          </>
        )}
        {transactionHash && (
          <div style={{ marginTop: '10px' }}>
            <a
              href={`https://sepolia.basescan.org/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Transaction
            </a>
          </div>
        )}
      </div>
    </>
  )
}

export default App
