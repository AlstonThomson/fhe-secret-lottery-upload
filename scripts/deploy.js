const hre = require("hardhat");

async function main() {
  console.log("🎲 Deploying Secret Lottery...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy SecretLotto
  console.log("📦 Deploying SecretLotto contract...");
  const SecretLotto = await hre.ethers.getContractFactory("SecretLotto");
  const lottery = await SecretLotto.deploy();
  await lottery.waitForDeployment();
  
  const lotteryAddress = await lottery.getAddress();
  console.log("✅ SecretLotto deployed:", lotteryAddress);

  // Get initial round info
  const currentRound = await lottery.getCurrentRound();
  console.log("\n🎰 Initial Round Info:");
  console.log("Round ID:", currentRound.roundId.toString());
  console.log("State: OPEN");
  console.log("Total Pool:", hre.ethers.formatEther(currentRound.totalPool), "ETH");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("Contract Address:", lotteryAddress);
  console.log("Network:", hre.network.name);
  console.log("Min Bet:", hre.ethers.formatEther(await lottery.minBet()), "ETH");
  console.log("Max Bet:", hre.ethers.formatEther(await lottery.maxBet()), "ETH");
  console.log("Platform Fee:", (await lottery.platformFee()).toString() + "%");
  console.log("=".repeat(60));

  // Save deployment info
  const fs = require("fs");
  const deploymentData = {
    network: hre.network.name,
    contractAddress: lotteryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    minBet: hre.ethers.formatEther(await lottery.minBet()),
    maxBet: hre.ethers.formatEther(await lottery.maxBet()),
  };

  if (!fs.existsSync("deployments")) {
    fs.mkdirSync("deployments");
  }

  const filename = `deployments/${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
  console.log("\n💾 Deployment info saved to:", filename);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

