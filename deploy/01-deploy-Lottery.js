const { network } = require("hardhat")
const { networkConfig } = require( "../helper.hardhat.config" )

const VRF_SUB_AMOUNT = ethers.utils.parseEther("10");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Address, subId;

  if (devChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    )
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
    //create subscription
    const txRs = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt  = await txRs.await(1); 
    subId = txReceipt.events[0].args.subId
    //fund the subscription
    await vrfCoordinatorV2Mock.fundSubscriptionId(subId, VRF_SUB_AMOUNT)
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorAddress"];
    subId = networkConfig[chainId]["subId"];

  }
  const entranceFee = networkConfig[chainId]["entranceFee"];
  const gasLane = networkConfig[chainId]["gasLane"];
  const args = [vrfCoordinatorV2Address, 
    entranceFee, gasLane];

    const lottery = await deploy("Lottery", {
      from: deployer,
      args: args,
      log: true,
      waitConfirmations: network.config.blockConfirmations || 1,
    })
  }
}

module.exports.tags = ["all", "lottery"]