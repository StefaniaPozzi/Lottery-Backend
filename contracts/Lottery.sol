//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract Lottery is VRFConsumerBaseV2 {
    uint256 private immutable i_ticketPrice;
    address payable[] private s_players; //when one address wins, we have to pay him back

    VRFCoordinatorV2Interface private immutable i_coordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private immutable NUM_WORDS = 1;

    address private s_recentWinner;

    event EventLottery__TicketBuyed(address indexed player); //tracking state is cheaper with events than storing in a var
    event EventLottery__RequestRandomWords(uint256 indexed requestId);
    event EventLottery__WinnerSelectedAndPaid(address indexed winner);
    error ErrorLottery__InsufficientTicketAmount();
    error ErrorLottery__PayingWinnerFailed();

    /**
     * @dev the constructor of VRFConsumerBaseV2 is called
     * and Lottery gains access to the requestRandomness function
     **/
    constructor(
        address vrfCoordinatorV2,
        uint256 ticketPrice,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_ticketPrice = ticketPrice;
        i_coordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    function buyTicket() public payable {
        if (msg.value < i_ticketPrice)
            revert ErrorLottery__InsufficientTicketAmount();
        s_players.push(payable(msg.sender));
        emit EventLottery__TicketBuyed(msg.sender);
    }

    /**
     * @dev This method is called by the keepers: we dont have to interact with it
     * Security feature / Escape the reentracy attack:
     * This is a 2 tx process (no simulation can be performed)
     * 1. request the random number
     * 2. number is returned from the chainlink and then we send money to the winner
     * @notice Fase 1: custom name
     * external are cheaper than public functions
     */
    function pickWinner() external {
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
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) revert ErrorLottery__PayingWinnerFailed();
        emit EventLottery__WinnerSelectedAndPaid(recentWinner);
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
}
