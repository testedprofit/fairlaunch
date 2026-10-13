const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

const DAY = 24 * 3600;

async function deployFixture() {
  const [creator, alice, bob] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("FairLaunchFactory");
  const factory = await Factory.deploy();
  const Locker = await ethers.getContractFactory("LiquidityLocker");
  const locker = await Locker.deploy();
  return { factory, locker, creator, alice, bob };
}

async function launchFixture() {
  const base = await deployFixture();
  const { factory, creator, alice } = base;
  const totalSupply = ethers.parseEther("1000000");
  const vestAmount = ethers.parseEther("200000");
  const start = (await time.latest()) + 60;
  const duration = 365 * DAY;
  const tx = await factory.createLaunch("TestCoin", "TST", totalSupply, 200, [
    { beneficiary: alice.address, amount: vestAmount, start, duration },
  ]);
  const receipt = await tx.wait();
  const tokenAddr = receipt.logs.find((l) => {
    try {
      return factory.interface.parseLog(l).name === "LaunchCreated";
    } catch {
      return false;
    }
  });
  const parsed = factory.interface.parseLog(tokenAddr);
  const token = await ethers.getContractAt("CreatorToken", parsed.args.token);
  const vestingWallet = await ethers.getContractAt(
    "VestingWallet",
    parsed.args.vestingWallets[0]
  );
  return { ...base, token, vestingWallet, totalSupply, vestAmount, start, duration };
}

describe("FairLaunchFactory", function () {
  it("deploys token with correct params and distributes supply", async function () {
    const { token, creator, alice, totalSupply, vestAmount } = await loadFixture(launchFixture);
    expect(await token.name()).to.equal("TestCoin");
    expect(await token.symbol()).to.equal("TST");
    expect(await token.totalSupply()).to.equal(totalSupply);
    expect(await token.owner()).to.equal(creator.address);
    expect(await token.maxWalletBps()).to.equal(200);
    expect(await token.balanceOf(alice.address)).to.equal(0); // vested, not direct
    expect(await token.balanceOf(creator.address)).to.equal(totalSupply - vestAmount);
  });

  it("funds the vesting wallet with the allocation", async function () {
    const { token, vestingWallet, vestAmount } = await loadFixture(launchFixture);
    expect(await token.balanceOf(await vestingWallet.getAddress())).to.equal(vestAmount);
  });

  it("tracks launches", async function () {
    const { factory, token, creator } = await loadFixture(launchFixture);
    expect(await factory.launchCount()).to.equal(1);
    const l = await factory.launches(0);
    expect(l.token).to.equal(await token.getAddress());
    expect(l.creator).to.equal(creator.address);
  });
});

describe("CreatorToken guards", function () {
  it("blocks public transfers before trading is enabled", async function () {
    const { token, creator, alice, bob } = await loadFixture(launchFixture);
    await expect(
      token.connect(alice).transfer(bob.address, 100)
    ).to.be.revertedWith("trading disabled");
    // owner (exempt) can still move tokens pre-launch
    await token.transfer(bob.address, 100);
    expect(await token.balanceOf(bob.address)).to.equal(100);
  });

  it("enforces the max-wallet cap once trading is live", async function () {
    const { token, creator, alice, bob } = await loadFixture(launchFixture);
    await token.enableTrading();
    // 2% of 1M = 20k max
    await expect(
      token.transfer(bob.address, ethers.parseEther("20001"))
    ).to.be.revertedWith("max wallet exceeded");
    await token.transfer(bob.address, ethers.parseEther("20000"));
    expect(await token.balanceOf(bob.address)).to.equal(ethers.parseEther("20000"));
  });
});

describe("FairLaunchFactory fees", function () {
  it("is free by default and lets the owner set a fee", async function () {
    const { factory, creator, alice } = await loadFixture(deployFixture);
    expect(await factory.launchFee()).to.equal(0);
    await factory.setLaunchFee(ethers.parseEther("0.02"));
    expect(await factory.launchFee()).to.equal(ethers.parseEther("0.02"));
    await expect(
      factory.connect(alice).setLaunchFee(1)
    ).to.be.revertedWith("not owner");
  });

  it("reverts launches that underpay the fee and forwards fees to treasury", async function () {
    const { factory, creator, alice } = await loadFixture(deployFixture);
    const fee = ethers.parseEther("0.02");
    await factory.setLaunchFee(fee);
    await factory.setTreasury(alice.address);
    const totalSupply = ethers.parseEther("1000");
    await expect(
      factory.createLaunch("F", "F", totalSupply, 10000, [])
    ).to.be.revertedWith("insufficient fee");
    const before = await ethers.provider.getBalance(alice.address);
    await factory.createLaunch("F", "F", totalSupply, 10000, [], { value: fee });
    const after = await ethers.provider.getBalance(alice.address);
    expect(after).to.equal(before + fee);
    expect(await factory.launchCount()).to.equal(1);
  });
});

describe("VestingWallet (OpenZeppelin)", function () {
  it("releases linearly over the vesting period", async function () {
    const { token, vestingWallet, vestAmount, alice, duration } = await loadFixture(launchFixture);
    const waddr = await vestingWallet.getAddress();
    const tokenAddr = await token.getAddress();
    // nothing vested at start
    expect(await vestingWallet["releasable(address)"](tokenAddr)).to.equal(0);
    // half way through -> ~half releasable
    await time.increase(duration / 2);
    const half = await vestingWallet["releasable(address)"](tokenAddr);
    expect(half).to.be.closeTo(vestAmount / 2n, ethers.parseEther("1"));
    await vestingWallet.connect(alice)["release(address)"](tokenAddr);
    // release tx mines a new block, so a few more seconds vest — allow dust tolerance
    expect(await token.balanceOf(alice.address)).to.be.closeTo(half, ethers.parseEther("0.01"));
    expect(await token.balanceOf(waddr)).to.be.closeTo(vestAmount - half, ethers.parseEther("0.01"));
  });
});

describe("LiquidityLocker", function () {
  async function lockerFixture() {
    const base = await deployFixture();
    const { creator, bob, locker } = base;
    // mock LP token: plain creator token with trading enabled
    const LP = await ethers.getContractFactory("CreatorToken");
    const lp = await LP.deploy(
      "LP Token",
      "LPT",
      ethers.parseEther("10000"),
      10000,
      creator.address,
      creator.address,
      []
    );
    await lp.enableTrading();
    return { ...base, lp };
  }

  it("locks LP tokens and blocks early withdrawal", async function () {
    const { locker, lp, creator, bob } = await loadFixture(lockerFixture);
    const amount = ethers.parseEther("1000");
    const unlockTime = (await time.latest()) + 30 * DAY;
    await lp.approve(await locker.getAddress(), amount);
    await locker.lock(await lp.getAddress(), amount, unlockTime, bob.address);
    expect(await locker.lockCount()).to.equal(1);
    await expect(locker.connect(bob).withdraw(0)).to.be.revertedWith("still locked");
  });

  it("releases to the beneficiary after unlock time", async function () {
    const { locker, lp, creator, bob } = await loadFixture(lockerFixture);
    const amount = ethers.parseEther("1000");
    const unlockTime = (await time.latest()) + 30 * DAY;
    await lp.approve(await locker.getAddress(), amount);
    await locker.lock(await lp.getAddress(), amount, unlockTime, bob.address);
    await time.increase(31 * DAY);
    await locker.connect(bob).withdraw(0);
    expect(await lp.balanceOf(bob.address)).to.equal(amount);
    const l = await locker.locks(0);
    expect(l.withdrawn).to.equal(true);
  });

  it("rejects zero amounts and past unlock times", async function () {
    const { locker, lp, creator, bob } = await loadFixture(lockerFixture);
    await expect(
      locker.lock(await lp.getAddress(), 0, (await time.latest()) + 100, bob.address)
    ).to.be.revertedWith("zero amount");
    await expect(
      locker.lock(await lp.getAddress(), 100, (await time.latest()) - 10, bob.address)
    ).to.be.revertedWith("unlock in past");
  });
});
