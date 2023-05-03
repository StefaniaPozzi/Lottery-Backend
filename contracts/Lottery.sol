//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

contract Lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    enum LotteryState {
        OPEN,
        BUSY
    }
    uint256 private immutable i_ticketPrice;
    address payable[] private s_players; //when one address wins, we have to pay him back

    VRFCoordinatorV2Interface private immutable i_coordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private immutable NUM_WORDS = 1;

    address private s_recentWinner;
    LotteryState private s_lotteryState;
    uint256 private s_previousBlockTimestamp;
    uint256 private immutable i_pickWinnerInterval;

    event EventLottery__TicketBuyed(address indexed player); //tracking state is cheaper with events than storing in a var
    event EventLottery__RequestRandomWords(uint256 indexed requestId);
    event EventLottery__WinnerSelectedAndPaid(address indexed winner);
    event EventLottery__IsUpkeepTrue(bool indexed upkeep);
    error ErrorLottery__InsufficientTicketAmount();
    error ErrorLottery__PayingWinnerFailed();
    error ErrorLottery__Busy();
    error ErrorLottery__PerformUpkeepNotNeeded();

    //     uint256 currentBalance,
    //     uint256 numPlayers,
    //     uint256 lotteryState
    // );

    /**
     * @dev the constructor of VRFConsumerBaseV2 is called
     * and Lottery gains access to the requestRandomness function
     **/
    constructor(
        address vrfCoordinatorV2,
        uint256 ticketPrice,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_ticketPrice = ticketPrice;
        i_coordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_lotteryState = LotteryState.OPEN;
        s_previousBlockTimestamp = block.timestamp;
        i_pickWinnerInterval = interval;
    }

    function buyTicket() public payable {
        if (msg.value < i_ticketPrice)
            revert ErrorLottery__InsufficientTicketAmount();
        if (s_lotteryState != LotteryState.OPEN) revert ErrorLottery__Busy();
        s_players.push(payable(msg.sender));
        emit EventLottery__TicketBuyed(msg.sender);
    }

    /**
     * @dev the chainlink keeper waits that upkeepNeeded becomes true
     * in order to performUpkeep and select the winner
     * 1. the state of the Lottery is OPEN
     * 2. every 30 seconds
     * 3. at least 1 player
     * 4. the contract has more than 0 ETH
     * 5. subscription is funded
     * @param upkeepNeeded is returned: no need to specify the type.
     * @dev since calldata does not work with strings, we use memory
     * @param performData is used when you want to perform some actions,
     *  depending on the result of upkeeepNeeded >> used by performUpkeep
     */
    function checkUpkeep(
        bytes memory /*checkData*/
    ) public override returns (bool upkeepNeeded, bytes memory performData) {
        bool isOpen = (LotteryState.OPEN == s_lotteryState);
        bool isIntervalPassed = ((block.timestamp - s_previousBlockTimestamp) >
            i_pickWinnerInterval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = (address(this).balance > 0);
        bool fireCondition = (isOpen &&
            isIntervalPassed &&
            hasPlayers &&
            hasBalance);
        emit EventLottery__IsUpkeepTrue(fireCondition);
        upkeepNeeded = fireCondition;
    }

    /**
     * @dev This method is called by the keepers when upkeepNeeded is true:
     * we dont have to interact with it!
     * Security feature / Escape the reentracy attack:
     * This is a 2 tx process (no simulation can be performed)
     * 1. request the random number - performUpkeep
     * 2. number is returned from the chainlink and then we send money to the winner - fulfillRandomWords
     * @notice Fase 1: custom name
     * external are cheaper than public functions
     */
    function performUpkeep(bytes calldata /*performData*/) external override {
        s_lotteryState = LotteryState.BUSY;
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) revert ErrorLottery__PerformUpkeepNotNeeded();
        // address(this).balance,
        // s_players.length,
        // uint256(s_lotteryState)
        // );
        uint256 requestId = i_coordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit EventLottery__RequestRandomWords(requestId);
    }

    /**
     * @notice Fase 2: chainlink coordinator that does the random number verification,
     * knows that he can call this method
     * */
    function fulfillRandomWords(
        uint256 /*requestId*/,
        uint256[] memory randomWords
    ) internal override {
        uint256 winnerIndex = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[winnerIndex];
        s_recentWinner = recentWinner;
        s_lotteryState = LotteryState.OPEN;
        s_players = new address payable[](0);
        s_previousBlockTimestamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) revert ErrorLottery__PayingWinnerFailed();
        emit EventLottery__WinnerSelectedAndPaid(recentWinner);
    }

    function setState(LotteryState _state) public {
        s_lotteryState = _state;
    }

    /* Pure and View functions */
    //is not possible to automatise this? like lombok
    function getTicketPrice() public view returns (uint256) {
        return i_ticketPrice;
    }

    function getPlayers(uint256 index) public view returns (address payable) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_lotteryState;
    }

    function getNumPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimestamp() public view returns (uint256) {
        return s_previousBlockTimestamp;
    }

    function getInterval() public view returns (uint256) {
        return i_pickWinnerInterval;
    }

    // reading from bytecode
    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }
}
