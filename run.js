const { ethers } = require("ethers");
const fs = require("fs");
const config = require("./config");

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeWithdraw() {
  try {
    // 1. Setup Wallet
    const privateKey = fs.readFileSync("wallet.txt", "utf-8").trim();
    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);

    // 2. Load Contract
    const abi = JSON.parse(fs.readFileSync("abi_teagov_withdraw.json"));
    const contract = new ethers.Contract(config.CONTRACT_ADDRESS, abi, wallet);

    // 3. Parameter Transaksi Sesuai Screenshot
    const withdrawAmount = 0.1;
    const amountInWei = ethers.parseEther(withdrawAmount.toString());
    
    const txParams = {
      gasLimit: 66732,
      gasPrice: ethers.parseUnits("1.500000513", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address)
    };

    // 4. Eksekusi Transaksi
    console.log(`🔄 [${new Date().toLocaleTimeString()}] Withdraw ${withdrawAmount} TEA...`);
    const tx = await contract.withdraw(amountInWei, txParams);
    
    // 5. Konfirmasi Transaksi
    console.log(`⏳ Menunggu konfirmasi: ${tx.hash}`);
    const receipt = await tx.wait();
    
    // 6. Format Output dengan Konversi BigInt yang Aman
    const gasUsed = Number(receipt.gasUsed);
    const gasLimit = Number(txParams.gasLimit);
    
    console.log(`
    ========== WITHDRAW BERHASIL ==========
    Status:      ✅ Success
    Hash:        ${receipt.hash}
    Block:       #${receipt.blockNumber}
    From:        ${wallet.address}
    To:          ${contract.address}
    Value:       ${withdrawAmount} TEA
    Gas Used:    ${gasUsed} (${((gasUsed/gasLimit)*100).toFixed(2)}%)
    Txn Fee:     ${ethers.formatEther(receipt.fee)} TEA
    Gas Price:   ${ethers.formatUnits(txParams.gasPrice, "gwei")} Gwei
    `);
    
    return true;
    
  } catch (error) {
    console.error(`\n❌ [${new Date().toLocaleTimeString()}] Error: ${error.shortMessage || error.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Memulai bot withdraw tetap 0.1 TEA");
  console.log("Tekan Ctrl+C untuk berhenti\n");

  let attempt = 1;
  const RETRY_DELAY = 120000;

  while(true) {
    console.log(`\n🔁 Eksekusi ke-${attempt}`);
    const success = await executeWithdraw();
    
    if(!success) {
      console.log(`⏳ Menunggu ${RETRY_DELAY/1000} detik sebelum mencoba lagi...`);
      await delay(RETRY_DELAY);
    }
    
    attempt++;
    await delay(2000);
  }
}

process.on('SIGINT', () => {
  console.log("\n🛑 Bot dihentikan manual");
  process.exit();
});

main();
