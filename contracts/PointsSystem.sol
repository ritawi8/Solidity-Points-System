// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract PointsSystem {

// === STRUCTS OCH ENUMS ===
    struct Member{
        string name;
        uint256 points;
        bool isRegistered;
    }

    enum RewardType {
        TShirt,
        VIPStatus
    }
    
// === STATE VARIABLES ===
    mapping(address => Member) public members;

    address public owner;


    // Mapping för att hålla koll på vilka adresser som är administratörer
    // address = personens adress, bool = true om admin, false om inte admin
    mapping(address => bool) public admins;

// === EVENTS ===
    event MemberRegistered(address indexed member, string name);
    event PointsEarned(address indexed member, uint256 amount);
    event PointsAssigned(address indexed admin, address indexed member, uint256 amount);
    event PointsTransferred(address indexed from, address indexed to, uint256 amount);
    event RewardClaimed(address indexed member, RewardType reward, uint256 cost);


// === MODIFIERS ===
     // Modifier som kontrollerar att anroparen är registrerad medlem
    modifier onlyAdmin(){
        require(admins[msg.sender], "Only admins can call this function"); //Kolla om anroparen är admin
        _; //Kör funktionen här om kravet ovan är uppfyllt
    }

    modifier onlyMember(){
        require(members[msg.sender].isRegistered, "You must be a registered member");// Modifier som kontrollerar att anroparen är registrerad medlem
        _; // Kör funktionen här om kravet ovan är uppfyllt
    }

   
  // === CONSTRUCTOR ===
   constructor(){
        owner = msg.sender; // Den som deployar blir ägare
        admins[msg.sender] = true; //Ägaren blir automatiskt admin också
    }

// === FUNCTIONS ===
        // Funktion för ägaren att lägga till nya administratörer 
    function assignAdmin(address newAdmin) public {
        require(msg.sender == owner, "Only owner can assign admins"); //Säkerhetskontroll
        admins[newAdmin] = true; // Markerar den nya addressen som admin
    }

    //Funktion för att registrera som medlem
    function registerMember(string memory memberName) public {
        require(!members[msg.sender].isRegistered, "Already registered as member");
    

        // Skapar en ny Member-struct och sparar i mappingen
        members[msg.sender] = Member({
            name: memberName, // Sätter namnet
            points: 0,        // Nya medlemar börjar med 0 poäng
            isRegistered: true // Markerar som registrerad
        });

        // Skickar event som loggas på blockchain
        emit MemberRegistered(msg.sender, memberName);
    }

     function earnPoints(uint256 amount) public onlyMember{
        members[msg.sender].points += amount;
        emit PointsEarned(msg.sender, amount);
    }

    function assignPoints(address memberAddress, uint256 amount) public onlyAdmin{
        require(members[memberAddress].isRegistered, "Member not registered");

        members[memberAddress].points += amount;
        emit PointsAssigned(msg.sender, memberAddress, amount);
    }

    function transferPoints(address to, uint256 amount) public onlyMember{
        require(members[to].isRegistered, "Target must be registered member");
        require(members[msg.sender].points >= amount, "You don't have enough points");
        
        members[msg.sender].points -=amount;
        members[to].points += amount;

        emit PointsTransferred(msg.sender, to, amount);
    }

    function redeemReward(RewardType reward) public onlyMember {
        uint256 cost;

        if ( reward == RewardType.TShirt) {
            cost = 100;
        } else if ( reward == RewardType.VIPStatus) {
            cost = 500;
        }

        require(members[msg.sender].points >= cost, "You don't have enough points");

        members[msg.sender].points -= cost;

        emit RewardClaimed(msg.sender, reward, cost);
    }
}