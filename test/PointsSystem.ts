import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("PointsSystem", function(){
    async function deployPointsSystemFixture(){
        const [owner, admin, member] = await ethers.getSigners();
        const PointsSystem = await ethers.getContractFactory("PointsSystem");
        const pointsSystem = await PointsSystem.deploy();
        return { pointsSystem, owner, admin, member }
    }
})