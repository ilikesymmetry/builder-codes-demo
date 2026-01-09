'use client'

import { useConnect, useConnection, useConnectors, useDisconnect, useSendCalls, useCallsStatus, useCapabilities } from 'wagmi'
import { base, baseSepolia, sepolia } from 'wagmi/chains'
import { zeroAddress, encodeFunctionData } from 'viem'
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

  const { data: capabilities } = useCapabilities()
  console.log('capabilities:', capabilities)

  const [selectedChain, setSelectedChain] = useState<'base' | 'baseSepolia' | 'sepolia'>('baseSepolia')
  const [attributionType, setAttributionType] = useState<'none' | 'canonical' | 'custom' | 'malformed'>('none')
  const [builderCode, setBuilderCode] = useState('')
  // const [chainId, setChainId] = useState('')
  const [registryAddress, setRegistryAddress] = useState<`0x${string}`>()
  const [rawSuffix, setRawSuffix] = useState('')
  const [parseSuffixInput, setParseSuffixInput] = useState('')
  const [parsedAttribution, setParsedAttribution] = useState<Attribution.Attribution | undefined | null>(null)

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

    const chainId = selectedChain === 'base' ? base.id : selectedChain === 'baseSepolia' ? baseSepolia.id : sepolia.id

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

  const handleBasePay = () => {
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

    const chainId = selectedChain === 'base' ? base.id : selectedChain === 'baseSepolia' ? baseSepolia.id : sepolia.id
    const accountAddress = connection.addresses?.[0]

    if (!accountAddress) return

    // Determine token address based on chain
    const tokenAddress = selectedChain === 'base' 
      ? '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
      : selectedChain === 'baseSepolia'
      ? '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
      : '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'

    // Encode ERC20 transfer function call: transfer(address to, uint256 amount)
    const data = encodeFunctionData({
      abi: [{
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ type: 'bool' }]
      }],
      functionName: 'transfer',
      args: [accountAddress, BigInt(1e4)]
    })

    sendCalls({
      chainId,
      calls: [
        {
          to: tokenAddress,
          data,
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

      {connection.status !== 'connected' && (
        <div>
          <h2>Connect</h2>
          {connectors.map((connector, index) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              type="button"
            >
              {connector.name} {connector.name === 'Base Account' && index == 0 ? "(local)" : connector.name === 'Base Account' && index == 1 ? "(beta)" : connector.name === 'Base Account' && index == 2 ? "(dev)" : ''}
            </button>
          ))}
          <div>{status}</div>
          <div>{error?.message}</div>
        </div>
      )}

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
                  onChange={(e) => setSelectedChain(e.target.value as 'base' | 'baseSepolia' | 'sepolia')}
                  style={{ padding: '5px', minWidth: '200px' }}
                >
                  <option value="baseSepolia">Base Sepolia</option>
                  <option value="sepolia">Ethereum Sepolia</option>
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={handleSendCalls}>
                Send Calls
              </button>
              <button type="button" onClick={handleBasePay}>
                Base Pay
              </button>
            </div>
          </>
        )}
        {transactionHash && (
          <div style={{ marginTop: '10px' }}>
            <a
              href={
                selectedChain === 'sepolia'
                  ? `https://sepolia.etherscan.io/tx/${transactionHash}`
                  : `https://${selectedChain === 'base' ? '' : 'sepolia.'}basescan.org/tx/${transactionHash}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              View Transaction
            </a>
          </div>
        )}
      </div>

      <div>
        <h2>Data Suffix Parsing</h2>
        <form style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="parse-suffix" style={{ display: 'block', marginBottom: '5px' }}>
              Data Suffix:
            </label>
            <input
              id="parse-suffix"
              type="text"
              value={parseSuffixInput}
              onChange={(e) => setParseSuffixInput(e.target.value)}
              placeholder="0x..."
              style={{ padding: '5px', minWidth: '300px' }}
            />
          </div>
        </form>
        <button
          type="button"
          onClick={() => {
            const result = Attribution.fromData(parseSuffixInput as `0x${string}`)
            setParsedAttribution(result)
          }}
        >
          Parse Data Suffix
        </button>
        {parsedAttribution !== null && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
            {parsedAttribution === undefined ? (
              <div style={{ color: '#999', marginTop: '5px' }}>No valid attribution found</div>
            ) : (
              <div style={{ marginTop: '5px' }}>
                <div><strong>Schema ID:</strong> {parsedAttribution.id ?? 0}</div>
                <div><strong>Codes:</strong> {parsedAttribution.codes.join(', ')}</div>
                {'codeRegistryAddress' in parsedAttribution && (
                  <div><strong>Registry Address:</strong> {parsedAttribution.codeRegistryAddress}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default App
