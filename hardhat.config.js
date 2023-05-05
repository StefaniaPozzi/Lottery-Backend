require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const RPC_URL_SEPOLIA = process.env.RPC_URL_SEPOLIA_ALCHEMY || ""
const PRIVATE_KEY_SEPOLIA = process.env.PRIVATE_KEY_SEPOLIA_METAMASK || ""
const ETHSCAN_API = process.env.VERIFY_ETHSCAN_API || ""
const COINMARKETCAP_KEY = process.env.COINMARKETCAP_KEY || ""

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
    },
    sepolia: {
      chainId: 11155111,
      blockConfirmations: 6,
      url: RPC_URL_SEPOLIA,
      accounts: [PRIVATE_KEY_SEPOLIA],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  etherscan: {
    apiKey: ETHSCAN_API,
  },
  gasReporter: {
    enabled: false,
  },
  mocha: {
    timeout: 100000,
  },
}
