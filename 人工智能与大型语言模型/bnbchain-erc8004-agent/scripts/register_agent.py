import os
import sys
from bnbagent import ERC8004Agent, EVMWalletProvider, AgentEndpoint

def main():
    password = os.getenv("WALLET_PASSWORD")
    if not password:
        print("Error: WALLET_PASSWORD environment variable not set.")
        sys.exit(1)

    print("Initializing Wallet Provider...")
    # EVMWalletProvider handles local keystore encryption/decryption
    wallet = EVMWalletProvider(password=password)

    print("Initializing SDK (BSC Testnet)...")
    # ERC8004Agent handles contract interaction and gasless paymaster
    sdk = ERC8004Agent(wallet_provider=wallet, network="bsc-testnet")
    
    print(f"Wallet Address: {sdk.wallet_address}")

    # Define Agent Metadata and Endpoints
    agent_uri = sdk.generate_agent_uri(
        name="BNBChain",
        description="Official AI Agent for BNB Chain community updates and interaction.",
        # Ideally, we would host a real agent-card.json. For now, using a placeholder or your Moltbook profile.
        endpoints=[
            AgentEndpoint(
                name="A2A",
                endpoint="https://clawhub.ai/0xlucasliao/bnbchain-erc8004-agent", 
                version="1.0.0"
            )
        ]
    )

    # Register the Agent
    print(f"Registering Agent...")
    try:
        result = sdk.register_agent(agent_uri=agent_uri)
        print(f"✓ Agent registered successfully!")
        print(f"  Agent ID: {result['agentId']}")
        print(f"  Transaction: https://testnet.bscscan.com/tx/{result['transactionHash']}")
    except Exception as e:
        print(f"✗ Registration failed: {e}")

if __name__ == "__main__":
    main()
