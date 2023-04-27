//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

error Lottery_InsufficientTicketAmount(); //tracking state is cheaper with events than storing in a var

contract Lottery{

    uint256 private immutable i_ticketPrice;
    address payable [] private s_players; //when one address wins, we have to pay him

    constructor (uint256 ticketPrice){
        i_ticketPrice = ticketPrice
    }

    function buyTicket() public payable{
        if (msg.value < i_ticketPrice)
            revert Lottery_InsufficientTicketAmount();
        s_players.push((payable)msg.sender);
    }

    function pickWinner(){}

//is not possible to automatise this? like lombok
    function getTicketPrice() returns (uint256){
        return i_ticketPrice;
    }

    function getPlayers(uint256 index) return(address payable){
        return s_players[index];
    }

}