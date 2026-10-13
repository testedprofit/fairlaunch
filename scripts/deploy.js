const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const bal = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(bal));

  const Factory = await hre.ethers.getContractFactory("FairLaunchFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("FairLaunchFactory:", factoryAddr);

  const Locker = await hre.ethers.getContractFactory("LiquidityLocker");
  const locker = await Locker.deploy();
  await locker.waitForDeployment();
  const lockerAddr = await locker.getAddress();
  console.log("LiquidityLocker:", lockerAddr);

  console.log("\n--- app/.env ---");
  console.log(`VITE_FACTORY_ADDRESS=${factoryAddr}`);
  console.log(`VITE_LOCKER_ADDRESS=${lockerAddr}`);

  const net = await hre.ethers.provider.getNetwork();
  console.log("\n--- app/src/config.ts registry entry ---");
  console.log(`  ${net.chainId}: { ...CHAINS[${net.chainId}], factory: "${factoryAddr}", locker: "${lockerAddr}" },`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
