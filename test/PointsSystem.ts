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


    describe("Deployment", function(){
        it("Should set the deployer as owner and admin", async function(){
            const { pointsSystem, owner } = await deployPointsSystemFixture();
            expect(await pointsSystem.owner()).to.equal(owner.address);
            expect(await pointsSystem.admins(owner.address)).to.be.true;
        })
    })

    describe("Member Registration", function (){
        it("Should allow member registration", async function(){
            const { pointsSystem, member } = await deployPointsSystemFixture();

            await pointsSystem.connect(member).registerMember("TestUser");

            //Kontrollera att medlemmen är registrerad
            const memberData = await pointsSystem.members(member.address);
            expect(memberData[2]).to.be.true;
        })
    })
})