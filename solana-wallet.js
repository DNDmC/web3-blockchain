// Dependências necessárias:
// npm install @solana/web3.js @solana/spl-token bs58@4.0.1

const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  StakeProgram,
  Authorized,
  Lockup,
  clusterApiUrl
} = require('@solana/web3.js');

const {
  TOKEN_PROGRAM_ID,
  Token,
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getAssociatedTokenAddress
} = require('@solana/spl-token');

const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

class SolanaWallet {
  /**
   * Inicializa uma nova instância da carteira Solana
   * @param {string} endpoint - URL do nó Solana (devnet, testnet ou mainnet)
   */
  constructor(endpoint = clusterApiUrl('devnet')) {
    // Conectar à rede Solana (default: devnet)
    this.connection = new Connection(endpoint);
    this.keypair = null;
    this.address = null;
    this.network = endpoint.includes('mainnet') ? 'mainnet' : 
               endpoint.includes('testnet') ? 'testnet' : 'devnet';
    
    console.log(`Carteira Solana conectada à rede: ${this.network}`);
  }

  /**
   * Gera um novo par de chaves e endereço Solana
   * @returns {Object} Objeto contendo endereço e chave privada
   */
  generateNewAddress() {
    // Gerar um novo par de chaves aleatório
    this.keypair = Keypair.generate();
    this.address = this.keypair.publicKey.toString();
    
    // A chave privada em Solana é um array de 64 bytes
    const privateKeyBase58 = bs58.encode(this.keypair.secretKey);
    
    return {
      address: this.address,
      privateKey: privateKeyBase58,
      message: "IMPORTANTE: Guarde sua chave privada em um local seguro. Quem tiver acesso a ela terá controle total sobre seus fundos."
    };
  }

  /**
   * Importa uma carteira a partir de uma chave privada existente
   * @param {string} privateKeyBase58 - Chave privada no formato base58
   * @returns {Object} Objeto contendo endereço e chave privada
   */
  importWallet(privateKeyBase58) {
    try {
      // Converter a chave privada de base58 para Uint8Array
      const secretKeyUint8 = bs58.decode(privateKeyBase58);
      
      // Criar o keypair a partir da chave secreta
      this.keypair = Keypair.fromSecretKey(secretKeyUint8);
      this.address = this.keypair.publicKey.toString();
      
      return {
        address: this.address,
        privateKey: privateKeyBase58
      };
    } catch (error) {
      throw new Error(`Falha ao importar carteira: ${error.message}`);
    }
  }

  /**
   * Salva a carteira em um arquivo JSON (NÃO RECOMENDADO para produção)
   * @param {string} filePath - Caminho onde salvar o arquivo da carteira
   */
  saveWallet(filePath = './minha-carteira-solana.json') {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    const walletData = {
      address: this.address,
      privateKey: bs58.encode(this.keypair.secretKey),
      network: this.network,
      dataCriacao: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(path.resolve(filePath), JSON.stringify(walletData, null, 2));
      return {
        success: true,
        message: `Carteira salva com sucesso em ${filePath}`,
        warning: "AVISO: Este arquivo contém sua chave privada. Nunca compartilhe este arquivo."
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Carrega uma carteira a partir de um arquivo JSON
   * @param {string} filePath - Caminho do arquivo da carteira
   */
  loadWallet(filePath = './minha-carteira-solana.json') {
    try {
      const walletData = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
      return this.importWallet(walletData.privateKey);
    } catch (error) {
      throw new Error(`Falha ao carregar carteira: ${error.message}`);
    }
  }

  /**
   * Obtém o saldo de SOL da carteira
   * @returns {Object} Saldo em SOL e informações adicionais
   */
  async getBalance() {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    try {
      const balance = await this.connection.getBalance(this.keypair.publicKey);
      
      return {
        address: this.address,
        balance: balance / LAMPORTS_PER_SOL, // Converter lamports para SOL
        unit: 'SOL',
        lamports: balance,
        network: this.network
      };
    } catch (error) {
      throw new Error(`Erro ao obter saldo: ${error.message}`);
    }
  }

  /**
   * Solicita SOL do faucet (apenas em redes de teste)
   * @returns {Object} Resultado da solicitação
   */
  async requestAirdrop(amountSOL = 1) {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    if (this.network === 'mainnet') {
      throw new Error('Airdrop não disponível na rede principal (mainnet)');
    }
    
    try {
      const signature = await this.connection.requestAirdrop(
        this.keypair.publicKey,
        amountSOL * LAMPORTS_PER_SOL
      );
      
      // Aguardar confirmação da transação
      await this.connection.confirmTransaction(signature);
      
      return {
        success: true,
        signature: signature,
        amountSOL: amountSOL,
        message: `${amountSOL} SOL recebido com sucesso`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Método alternativo para solicitar SOL do faucet via websites externos
   * @returns {Object} Instruções para obter SOL manualmente
   */
  async requestAirdropAlternative(amountSOL = 1) {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    console.log(`Para receber SOL para testes, por favor visite um destes faucets e cole seu endereço:`);
    console.log(`Endereço da carteira: ${this.address}`);
    console.log(`1. https://faucet.solana.com/`);
    console.log(`2. https://solfaucet.com/`);
    console.log(`3. https://faucet.quicknode.com/solana/devnet`);
    
    // Aguardar alguns segundos para que o usuário possa ler as instruções
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(`\nApós solicitar SOL, você pode verificar seu saldo com wallet.getBalance()`);
    
    return {
      success: true,
      message: "Instruções para obter SOL exibidas. Use faucet externo conforme indicado."
    };
  }

  /**
   * Envia SOL para outro endereço
   * @param {string} destinationAddress - Endereço de destino
   * @param {number} amountSOL - Quantidade de SOL a enviar
   * @returns {Object} Resultado da transação
   */
  async sendSOL(destinationAddress, amountSOL) {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    try {
      // Converter o endereço de destino para PublicKey
      const destinationPublicKey = new PublicKey(destinationAddress);
      
      // Obter o saldo atual para verificar se há fundos suficientes
      const currentBalance = await this.connection.getBalance(this.keypair.publicKey);
      const amountLamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);
      
      // Estimar a taxa de transação (aproximadamente 0.000005 SOL)
      const estimatedFee = 5000;
      
      if (currentBalance < amountLamports + estimatedFee) {
        throw new Error(`Saldo insuficiente. Necessário: ${(amountLamports + estimatedFee) / LAMPORTS_PER_SOL} SOL, Disponível: ${currentBalance / LAMPORTS_PER_SOL} SOL`);
      }
      
      // Criar uma instrução de transferência
      const instruction = SystemProgram.transfer({
        fromPubkey: this.keypair.publicKey,
        toPubkey: destinationPublicKey,
        lamports: amountLamports
      });
      
      // Criar e enviar a transação
      const transaction = new Transaction().add(instruction);
      transaction.feePayer = this.keypair.publicKey;
      
      // Obter o último blockhash para incluir na transação
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      
      // Assinar e enviar a transação
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair]
      );
      
      return {
        success: true,
        signature: signature,
        explorer: `https://explorer.solana.com/tx/${signature}?cluster=${this.network}`,
        amountSOL: amountSOL,
        recipient: destinationAddress
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém informações de um token SPL
   * @param {string} tokenAddress - Endereço do token SPL
   * @returns {Object} Informações do token
   */
  async getTokenInfo(tokenAddress) {
    try {
      const tokenPublicKey = new PublicKey(tokenAddress);
      const token = new Token(
        this.connection,
        tokenPublicKey,
        TOKEN_PROGRAM_ID,
        this.keypair
      );
      
      // Obter informações do token
      const tokenInfo = await token.getMintInfo();
      
      return {
        address: tokenAddress,
        decimals: tokenInfo.decimals,
        totalSupply: tokenInfo.supply.toString(),
        authority: tokenInfo.mintAuthority ? tokenInfo.mintAuthority.toString() : null,
        freezable: tokenInfo.freezeAuthority ? true : false
      };
    } catch (error) {
      throw new Error(`Erro ao obter informações do token: ${error.message}`);
    }
  }

  /**
   * Obtém o saldo de um token SPL específico
   * @param {string} tokenAddress - Endereço do token SPL
   * @returns {Object} Saldo do token e informações adicionais
   */
  async getTokenBalance(tokenAddress) {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    try {
      const tokenPublicKey = new PublicKey(tokenAddress);
      
      // Encontrar o endereço da conta de token associada
      const tokenAccountAddress = await getAssociatedTokenAddress(
        tokenPublicKey,
        this.keypair.publicKey
      );
      
      // Verificar se a conta existe
      try {
        const tokenAccount = await this.connection.getTokenAccountBalance(tokenAccountAddress);
        const tokenInfo = await this.getTokenInfo(tokenAddress);
        
        return {
          address: tokenAddress,
          balance: tokenAccount.value.uiAmount,
          rawBalance: tokenAccount.value.amount,
          decimals: tokenAccount.value.decimals,
          symbol: tokenInfo ? tokenInfo.symbol : 'Desconhecido'
        };
      } catch (err) {
        // Se a conta não existir, retorna saldo zero
        return {
          address: tokenAddress,
          balance: 0,
          rawBalance: '0',
          decimals: 0,
          symbol: 'Desconhecido'
        };
      }
    } catch (error) {
      throw new Error(`Erro ao obter saldo do token: ${error.message}`);
    }
  }

  /**
   * Transfere tokens SPL para outro endereço
   * @param {string} tokenAddress - Endereço do token SPL
   * @param {string} destinationAddress - Endereço de destino
   * @param {number} amount - Quantidade de tokens a enviar
   * @returns {Object} Resultado da transação
   */

  async sendToken(tokenAddress, destinationAddress, amount) {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    try {
      const tokenPublicKey = new PublicKey(tokenAddress);
      const destinationPublicKey = new PublicKey(destinationAddress);
      
      // Obter informações do token para saber os decimais
      const tokenInfo = await this.getTokenInfo(tokenAddress);
      const decimalFactor = Math.pow(10, tokenInfo.decimals);
      
      // Calcular a quantidade ajustada pelos decimais
      const adjustedAmount = Math.floor(amount * decimalFactor);
      
      // Encontrar ou criar a conta de token do remetente
      const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.keypair,
        tokenPublicKey,
        this.keypair.publicKey
      );
      
      // Verificar se há saldo suficiente
      if (Number(sourceTokenAccount.amount) < adjustedAmount) {
        throw new Error(`Saldo insuficiente de tokens. Necessário: ${amount}, Disponível: ${Number(sourceTokenAccount.amount) / decimalFactor}`);
      }
      
      // Encontrar ou criar a conta de token do destinatário
      const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.keypair,
        tokenPublicKey,
        destinationPublicKey
      );
      
      // Criar transferência
      const transaction = new Transaction().add(
        createTransferInstruction(
          sourceTokenAccount.address,
          destinationTokenAccount.address,
          this.keypair.publicKey,
          adjustedAmount
        )
      );
      
      // Obter o último blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.keypair.publicKey;
      
      // Enviar transação
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair]
      );
      
      return {
        success: true,
        signature: signature,
        explorer: `https://explorer.solana.com/tx/${signature}?cluster=${this.network}`,
        token: tokenAddress,
        amount: amount,
        recipient: destinationAddress
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém o histórico de transações da carteira
   * @param {number} limit - Número máximo de transações a retornar
   * @returns {Array} Lista de transações
   */
  async getTransactionHistory(limit = 10) {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    try {
      // Obter assinaturas de transações para o endereço
      const signatures = await this.connection.getSignaturesForAddress(
        this.keypair.publicKey,
        { limit: limit }
      );
      
      // Se não houver transações, retornar lista vazia
      if (!signatures || signatures.length === 0) {
        console.log("Nenhuma transação encontrada para este endereço");
        return [];
      }
      
      // Versão simplificada para evitar erros - retorna apenas informações básicas
      return signatures.map(info => ({
        signature: info.signature,
        date: info.blockTime ? new Date(info.blockTime * 1000).toISOString() : 'Data desconhecida',
        status: info.confirmationStatus || 'Desconhecido',
        explorer: `https://explorer.solana.com/tx/${info.signature}?cluster=${this.network}`
      }));
    } catch (error) {
      console.error(`Erro ao obter histórico de transações: ${error.message}`);
      return [];
    }
  }

  /**
   * Faz stake de SOL para participar da rede e ganhar recompensas
   * @param {number} amountSOL - Quantidade de SOL para stake
   * @param {string} validatorAddress - Endereço do validador
   * @returns {Object} Resultado da operação de stake
   */
  async stakeSOL(amountSOL, validatorAddress) {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    try {
      // Converter o endereço do validador para PublicKey
      const validatorPublicKey = new PublicKey(validatorAddress);
      
      // Criar uma nova conta de stake
      const stakeAccount = Keypair.generate();
      const amountLamports = amountSOL * LAMPORTS_PER_SOL;
      
      // Obter o mínimo de lamports necessários para isenção de aluguel
      const rent = await this.connection.getMinimumBalanceForRentExemption(
        StakeProgram.space
      );
      
      // Criar transação para inicializar a conta de stake
      const transaction = new Transaction().add(
        // Criar a conta de stake
        SystemProgram.createAccount({
          fromPubkey: this.keypair.publicKey,
          newAccountPubkey: stakeAccount.publicKey,
          lamports: rent + amountLamports,
          space: StakeProgram.space,
          programId: StakeProgram.programId
        }),
        
        // Inicializar a conta de stake
        StakeProgram.initialize({
          stakePubkey: stakeAccount.publicKey,
          authorized: new Authorized(
            this.keypair.publicKey, // autoridade de staking
            this.keypair.publicKey  // autoridade de retirada
          ),
          lockup: new Lockup(0, 0, this.keypair.publicKey) // sem bloqueio
        }),
        
        // Delegar stake para o validador
        StakeProgram.delegate({
          stakePubkey: stakeAccount.publicKey,
          authorizedPubkey: this.keypair.publicKey,
          votePubkey: validatorPublicKey
        })
      );
      
      // Enviar e confirmar a transação
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair, stakeAccount]
      );
      
      return {
        success: true,
        signature: signature,
        stakeAccount: stakeAccount.publicKey.toString(),
        amountSOL: amountSOL,
        validator: validatorAddress,
        explorer: `https://explorer.solana.com/tx/${signature}?cluster=${this.network}`,
        message: "SOL colocado em stake com sucesso. As recompensas serão acumuladas automaticamente."
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém informações sobre as contas de stake associadas a esta carteira
   * @returns {Array} Lista de contas de stake
   */
  async getStakeAccounts() {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    try {
      // Obter todas as contas pertencentes ao programa de stake
      const stakeAccounts = await this.connection.getParsedProgramAccounts(
        StakeProgram.programId,
        {
          filters: [
            {
              dataSize: StakeProgram.space,
            },
            {
              memcmp: {
                offset: 12, // offset da autoridade na conta de stake
                bytes: this.keypair.publicKey.toBase58(),
              },
            },
          ],
        }
      );
      
      // Processar cada conta de stake
      const stakeAccountsList = [];
      for (const account of stakeAccounts) {
        const stakeInfo = await this.connection.getStakeActivation(account.pubkey);
        
        stakeAccountsList.push({
          address: account.pubkey.toString(),
          state: stakeInfo.state, // active, inactive, activating, deactivating
          activeValue: stakeInfo.active / LAMPORTS_PER_SOL,
          inactiveValue: stakeInfo.inactive / LAMPORTS_PER_SOL,
          totalValue: (await this.connection.getBalance(account.pubkey)) / LAMPORTS_PER_SOL
        });
      }
      
      return stakeAccountsList;
    } catch (error) {
      throw new Error(`Erro ao obter contas de stake: ${error.message}`);
    }
  }

  /**
   * Finaliza o stake e retorna os SOL para a carteira
   * @param {string} stakeAccountAddress - Endereço da conta de stake
   * @returns {Object} Resultado da operação
   */
  async deactivateStake(stakeAccountAddress) {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    try {
      const stakeAccountPublicKey = new PublicKey(stakeAccountAddress);
      
      // Primeiro, desativar a delegação
      const deactivateTx = await sendAndConfirmTransaction(
        this.connection,
        new Transaction().add(
          StakeProgram.deactivate({
            stakePubkey: stakeAccountPublicKey,
            authorizedPubkey: this.keypair.publicKey,
          })
        ),
        [this.keypair]
      );
      
      return {
        success: true,
        signature: deactivateTx,
        explorer: `https://explorer.solana.com/tx/${deactivateTx}?cluster=${this.network}`,
        message: "Stake desativado com sucesso. Os fundos ficarão disponíveis após o próximo período de epoch (aproximadamente 2-3 dias)."
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Saca SOL de uma conta de stake desativada
   * @param {string} stakeAccountAddress - Endereço da conta de stake
   * @returns {Object} Resultado da operação
   */
  async withdrawStake(stakeAccountAddress) {
    if (!this.keypair) {
      throw new Error('Carteira não inicializada');
    }
    
    try {
      const stakeAccountPublicKey = new PublicKey(stakeAccountAddress);
      
      // Verificar se o stake está completamente desativado
      const stakeInfo = await this.connection.getStakeActivation(stakeAccountPublicKey);
      if (stakeInfo.state !== 'inactive') {
        throw new Error(`O stake ainda não está completamente desativado. Estado atual: ${stakeInfo.state}`);
      }
      
      // Obter o saldo atual da conta de stake
      const stakeBalance = await this.connection.getBalance(stakeAccountPublicKey);
      
      // Sacar todos os fundos de volta para a carteira principal
      const withdrawTx = await sendAndConfirmTransaction(
        this.connection,
        new Transaction().add(
          StakeProgram.withdraw({
            stakePubkey: stakeAccountPublicKey,
            authorizedPubkey: this.keypair.publicKey,
            toPubkey: this.keypair.publicKey,
            lamports: stakeBalance
          })
        ),
        [this.keypair]
      );
      
      return {
        success: true,
        signature: withdrawTx,
        amountSOL: stakeBalance / LAMPORTS_PER_SOL,
        explorer: `https://explorer.solana.com/tx/${withdrawTx}?cluster=${this.network}`,
        message: `${stakeBalance / LAMPORTS_PER_SOL} SOL foi retirado com sucesso da conta de stake.`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Função para demonstrar o uso da carteira
async function solanaWalletExample() {
  console.log("========= CARTEIRA SOLANA - EXEMPLO DE USO =========\n");
  
  try {
    // Inicializar carteira na rede de desenvolvimento
    const wallet = new SolanaWallet(clusterApiUrl('devnet'));
    console.log("✅ Carteira inicializada na devnet");
    
    // Gerar um novo endereço
    const newWallet = wallet.generateNewAddress();
    console.log("\n🔑 Nova carteira gerada:");
    console.log(`  Endereço: ${newWallet.address}`);
    console.log(`  Chave Privada: ${newWallet.privateKey.slice(0, 10)}...`);
    console.log(`  ${newWallet.message}`);
    
    // Solicitar SOL do faucet (apenas devnet/testnet)
    console.log("\n💧 Solicitando SOL do faucet...");
    let airdrop = await wallet.requestAirdrop(2);
    if (!airdrop.success) {
      console.log(`  ❌ Falha ao receber SOL: ${airdrop.error}`);
      console.log("  🔄 Tentando método alternativo...");
      airdrop = await wallet.requestAirdropAlternative(2);
      console.log(`  ℹ️ ${airdrop.message}`);
    } else {
      console.log(`  ✅ ${airdrop.amountSOL} SOL recebido na carteira`);
    }
    
    // Verificar saldo
    console.log("\n💰 Verificando saldo...");
    const balance = await wallet.getBalance();
    console.log(`  Saldo atual: ${balance.balance} SOL`);
    
    // Salvar a carteira em um arquivo
    console.log("\n💾 Salvando carteira...");
    const saveResult = wallet.saveWallet('./minha-carteira-solana-demo.json');
    if (saveResult.success) {
      console.log(`  ✅ ${saveResult.message}`);
      console.log(`  ⚠️ ${saveResult.warning}`);
    }
    
    // Enviar SOL para um endereço (comentado por segurança)
    /*
    console.log("\n📤 Enviando SOL...");
    // Substitua pelo endereço real de destino
    const destinationAddress = "SUBSTITUA_PELO_ENDERECO_DESTINO";
    const sendResult = await wallet.sendSOL(destinationAddress, 0.1);
    if (sendResult.success) {
      console.log(`  ✅ ${sendResult.amountSOL} SOL enviado para ${sendResult.recipient}`);
      console.log(`  📝 Assinatura da transação: ${sendResult.signature}`);
      console.log(`  🔍 Explorador: ${sendResult.explorer}`);
    } else {
      console.log(`  ❌ Falha ao enviar SOL: ${sendResult.error}`);
    }
    */
    
    // Histórico de transações é opcional e simplificado para evitar erros
    try {
      console.log("\n📋 Obtendo histórico de transações...");
      const transactions = await wallet.getTransactionHistory(5);
      console.log(`  Encontradas ${transactions.length} transações.`);
      if (transactions.length > 0) {
        console.log("  Últimas transações:");
        transactions.forEach((tx, i) => {
          console.log(`  ${i+1}. Data: ${tx.date} - Status: ${tx.status}`);
          console.log(`     Assinatura: ${tx.signature.slice(0, 10)}...`);
        });
      }
    } catch (err) {
      console.log("  ⚠️ Não foi possível obter o histórico de transações.");
    }
    
    console.log("Demonstração da carteira Solana concluída com sucesso!");
    
  } catch (error) {
    console.error("Erro durante a demonstração:", error);
  }
}

// Exportar a classe para uso em outros arquivos
module.exports = {
  SolanaWallet,
  solanaWalletExample
};

// Se este arquivo for executado diretamente, executa o exemplo
if (require.main === module) {
  solanaWalletExample();
}