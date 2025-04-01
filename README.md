# Solana Wallet Project

A complete implementation of a Solana blockchain wallet in JavaScript, supporting key generation, transactions, SPL tokens, and staking operations.

## Features

- 🔑 Generate and import wallets with secure key pairs  
- 💸 Send and receive SOL tokens  
- 🪙 Support for SPL tokens (similar to ERC-20 on Ethereum)  
- 💼 Wallet backup and recovery  
- 📊 Transaction history  
- 🥩 Support for staking SOL to earn rewards  
- 🧪 Compatible with Devnet and Testnet for development and testing  

## Technical Concepts Explained

### Key Terms

- **Blockchain**: A distributed digital ledger that records transactions across many computers.
- **Solana**: A high-performance blockchain supporting smart contracts and decentralized applications.
- **SOL**: The native cryptocurrency of the Solana blockchain.
- **Lamports**: The smallest unit of SOL (1 SOL = 1,000,000,000 lamports).
- **Wallet**: Software that stores private keys and interacts with the blockchain.
- **Public Key**: Your wallet address that can be shared (like your bank account number).
- **Private Key**: The secret key that proves ownership of your wallet (never share this).
- **SPL Tokens**: Solana Program Library tokens, Solana's equivalent to Ethereum's ERC-20 tokens.
- **Staking**: Locking up SOL to support network security and earn rewards.

## How This Wallet Works

### Key Generation
Uses cryptographic algorithms to create public/private key pairs.

### Account Model
Unlike Bitcoin's UTXO model, Solana uses an account-based model similar to Ethereum.

### Transaction Flow:
1. Create a transaction object.
2. Add instructions (e.g., transfer SOL).
3. Get a recent blockhash.
4. Sign with your private key.
5. Submit to the network.

### SPL Token Operations:
- Uses associated token accounts (ATAs).
- Requires SOL for rent exemption.
- Tokens have metadata like decimals and supply.

### Staking Process:
1. Create stake account.
2. Initialize with authorized withdrawer/staker.
3. Delegate to a validator.
4. Deactivate to unstake.
5. Withdraw after cooling period.

## Installation
Clone the repository and install dependencies:

```bash
 git clone https://github.com/yourusername/solana-wallet-js.git
 cd solana-wallet-js
 npm install
```

### Required dependencies:
- `@solana/web3.js`: Core library for interacting with Solana blockchain.
- `@solana/spl-token`: Library for working with Solana tokens.
- `bs58@4.0.1`: For Base58 encoding/decoding of keys and signatures.

## Usage

### Basic Usage
```javascript
const { SolanaWallet } = require('./solana-wallet.js');
const { clusterApiUrl } = require('@solana/web3.js');

// Initialize wallet on devnet
const wallet = new SolanaWallet(clusterApiUrl('devnet'));

// Generate a new wallet
const newWallet = wallet.generateNewAddress();
console.log(`Address: ${newWallet.address}`);
console.log(`Private Key: ${newWallet.privateKey}`);

// Request SOL from a faucet (devnet only)
wallet.requestAirdrop(1).then(result => {
  console.log(`Airdrop result: ${result.success ? 'Success' : 'Failed'}`);
});

// Check balance
wallet.getBalance().then(balance => {
  console.log(`Balance: ${balance.balance} SOL`);
});
```

### Working with SPL Tokens
```javascript
// Get token balance
wallet.getTokenBalance('TOKEN_ADDRESS').then(balance => {
  console.log(`Token Balance: ${balance.balance}`);
});

// Send tokens
wallet.sendToken('TOKEN_ADDRESS', 'DESTINATION_ADDRESS', 1.5).then(result => {
  if (result.success) {
    console.log(`Tokens sent! Transaction: ${result.signature}`);
  }
});
```

### Staking SOL
```javascript
// Stake SOL to a validator
wallet.stakeSOL(5, 'VALIDATOR_ADDRESS').then(result => {
  if (result.success) {
    console.log(`Staked ${result.amountSOL} SOL successfully!`);
    console.log(`Stake account: ${result.stakeAccount}`);
  }
});
```

## Technical Implementation Details

### Cryptography
This wallet uses elliptic curve cryptography (Ed25519) for key generation and signatures. The cryptographic operations are handled by Solana's web3.js library, which provides:

- **Keypair generation**: Creates cryptographically secure random keys.
- **Message signing**: Uses private keys to create digital signatures.
- **Signature verification**: Validates signatures using public keys.

### Transaction Structure
A Solana transaction consists of:

- **Instructions**: Commands to execute (e.g., "transfer X SOL from A to B").
- **Blockhash**: Recent blockchain hash to prevent replay attacks.
- **Signatures**: Digital signatures from required parties.

### Network Interaction
The wallet connects to Solana nodes via JSON-RPC API calls, allowing it to:

- Query account balances and information.
- Submit transactions.
- Monitor transaction confirmations.
- Subscribe to account changes.

### SPL Token Architecture
SPL tokens extend Solana's capabilities:

- Tokens are managed by the Token Program (a system program).
- Each token has a mint account storing metadata.
- Users have associated token accounts for each token type.
- Transfers require additional instructions compared to SOL transfers.

## Security Notes
⚠️ **Important:**

- Never share or expose your private key.
- This implementation is for educational purposes.
- Use hardware wallets for significant amounts.
- Back up your private keys securely.

## Development and Testing
For development, use Solana's devnet or testnet:

```javascript
// Connect to devnet (free test SOL, high limits)
const wallet = new SolanaWallet(clusterApiUrl('devnet'));

// Connect to testnet (free test SOL, production-like conditions)
const wallet = new SolanaWallet(clusterApiUrl('testnet'));

// Connect to mainnet (real funds)
const wallet = new SolanaWallet(clusterApiUrl('mainnet-beta'));
```

## License
MIT

# Projeto de Carteira Solana

Uma implementação completa de uma carteira para blockchain Solana em JavaScript, com suporte para geração de chaves, transações, tokens SPL e operações de staking.

## Funcionalidades

- 🔑 Gerar e importar carteiras com pares de chaves seguras
- 💸 Enviar e receber tokens SOL
- 🪙 Suporte para tokens SPL (semelhantes aos ERC-20 no Ethereum)
- 💼 Backup e recuperação de carteira
- 📊 Histórico de transações
- 🥩 Suporte para stake de SOL para ganhar recompensas
- 🧪 Compatível com Devnet e Testnet para desenvolvimento e testes

## Conceitos Técnicos

### Termos-chave

- **Blockchain**: Um livro-razão digital distribuído que registra transações em vários computadores.
- **Solana**: Uma blockchain de alto desempenho que suporta contratos inteligentes e aplicativos descentralizados.
- **SOL**: A criptomoeda nativa da blockchain Solana.
- **Lamports**: A menor unidade de SOL (1 SOL = 1.000.000.000 lamports).
- **Carteira**: Software que armazena chaves privadas e interage com a blockchain.
- **Chave Pública**: Seu endereço de carteira que pode ser compartilhado (como seu número de conta bancária).
- **Chave Privada**: A chave secreta que comprova a propriedade da sua carteira (nunca compartilhe).
- **Tokens SPL**: Solana Program Library tokens, equivalente da Solana aos tokens ERC-20 do Ethereum.
- **Staking**: Bloquear SOL para apoiar a segurança da rede e ganhar recompensas.

## Como Esta Carteira Funciona

### Geração de Chaves
Usa algoritmos criptográficos para criar pares de chaves públicas/privadas.

### Modelo de Conta
Diferente do modelo UTXO do Bitcoin, a Solana usa um modelo baseado em contas similar ao Ethereum.

### Fluxo de Transação
1. Criar um objeto de transação
2. Adicionar instruções (ex: transferir SOL)
3. Obter um blockhash recente
4. Assinar com sua chave privada
5. Enviar para a rede

### Operações com Tokens SPL
- Usa contas de token associadas (ATAs)
- Requer SOL para isenção de aluguel
- Tokens têm metadados como decimais e oferta

### Processo de Staking
1. Criar conta de stake
2. Inicializar com autorizador de saque/staker
3. Delegar a um validador
4. Desativar para unstake
5. Sacar após período de resfriamento

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/seuusuario/solana-wallet-js.git
cd solana-wallet-js
npm install
```

### Dependências Necessárias

- `@solana/web3.js`: Biblioteca principal para interagir com a blockchain Solana
- `@solana/spl-token`: Biblioteca para trabalhar com tokens Solana
- `bs58@4.0.1`: Para codificação/decodificação Base58 de chaves e assinaturas

## Uso

### Uso Básico

```javascript
const { SolanaWallet } = require('./solana-wallet.js');
const { clusterApiUrl } = require('@solana/web3.js');

// Inicializar carteira na devnet
const wallet = new SolanaWallet(clusterApiUrl('devnet'));

// Gerar uma nova carteira
const newWallet = wallet.generateNewAddress();
console.log(`Endereço: ${newWallet.address}`);
console.log(`Chave Privada: ${newWallet.privateKey}`);

// Solicitar SOL de um faucet (apenas devnet)
wallet.requestAirdrop(1).then(result => {
  console.log(`Resultado do airdrop: ${result.success ? 'Sucesso' : 'Falha'}`);
});

// Verificar saldo
wallet.getBalance().then(balance => {
  console.log(`Saldo: ${balance.balance} SOL`);
});
```

### Trabalhando com Tokens SPL

```javascript
// Obter saldo de um token
wallet.getTokenBalance('ENDERECO_DO_TOKEN').then(balance => {
  console.log(`Saldo do Token: ${balance.balance}`);
});

// Enviar tokens
wallet.sendToken('ENDERECO_DO_TOKEN', 'ENDERECO_DESTINO', 1.5).then(result => {
  if (result.success) {
    console.log(`Tokens enviados! Transação: ${result.signature}`);
  }
});
```

### Staking de SOL

```javascript
// Fazer stake de SOL para um validador
wallet.stakeSOL(5, 'ENDERECO_DO_VALIDADOR').then(result => {
  if (result.success) {
    console.log(`${result.amountSOL} SOL em stake com sucesso!`);
    console.log(`Conta de stake: ${result.stakeAccount}`);
  }
});
```

## Detalhes da Implementação Técnica

### Criptografia

Esta carteira usa criptografia de curva elíptica (Ed25519) para geração de chaves e assinaturas. As operações criptográficas são tratadas pela biblioteca `web3.js` da Solana, que fornece:

- **Geração de Keypair**: Cria chaves aleatórias criptograficamente seguras
- **Assinatura de mensagens**: Usa chaves privadas para criar assinaturas digitais
- **Verificação de assinatura**: Valida assinaturas usando chaves públicas

### Estrutura de Transação

Uma transação Solana consiste em:

- **Instruções**: Comandos para executar (ex: "transferir X SOL de A para B")
- **Blockhash**: Hash recente da blockchain para prevenir ataques de repetição
- **Assinaturas**: Assinaturas digitais das partes necessárias

### Interação com a Rede

A carteira se conecta aos nós Solana via chamadas API JSON-RPC, permitindo:

- Consultar saldos e informações de contas
- Enviar transações
- Monitorar confirmações de transações
- Inscrever-se para alterações de conta

## Notas de Segurança

⚠️ Importante:

- Nunca compartilhe ou exponha sua chave privada
- Esta implementação é para fins educacionais
- Use carteiras hardware para quantias significativas
- Faça backup de suas chaves privadas com segurança

## Licença

MIT



