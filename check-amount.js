const { SolanaWallet } = require('./solana-wallet.js');
const { clusterApiUrl } = require('@solana/web3.js');

async function verificarSaldo() {
  try {
    // Criar uma instância da carteira
    const wallet = new SolanaWallet(clusterApiUrl('devnet'));
    
    // Carregar sua carteira existente
    wallet.loadWallet('./minha-carteira-solana-demo.json');
    
    // Verificar o saldo
    const info = await wallet.getBalance();
    console.log(`Endereço: ${info.address}`);
    console.log(`Saldo atual: ${info.balance} SOL`);
    console.log(`Rede: ${info.network}`);
    
    // Verificar histórico de transações para confirmar os depósitos
    const transacoes = await wallet.getTransactionHistory(5);
    if (transacoes.length > 0) {
      console.log("\nÚltimas transações:");
      transacoes.forEach((tx, i) => {
        console.log(`${i+1}. ${tx.date} - ${tx.status}`);
        console.log(`   ID: ${tx.signature}`);
      });
    } else {
      console.log("\nNenhuma transação encontrada ainda.");
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

verificarSaldo();