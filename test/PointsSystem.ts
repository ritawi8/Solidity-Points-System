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

        it("Should not allow dubble registration", async function(){
            const { pointsSystem, member } = await deployPointsSystemFixture();

            //Första registreringen - ska fungera
            await pointsSystem.connect(member).registerMember("TestUser");

            //Andra registreringen - ska misslyckas med fel
            await expect(pointsSystem.connect(member).registerMember("TestUser2"))
            .to.be.rejectedWith("Already registered as member")
        })
    })

    describe("Assign Points", function (){
        it("Should allow admin to assign points to member", async function(){
            const { pointsSystem, owner, admin, member } = await deployPointsSystemFixture();

            //Först: gör admin till faktisk admin
            await pointsSystem.connect(owner).assignAdmin(admin.address);

            //Sen:  registrera medlem
            await pointsSystem.connect(member).registerMember("TestUser");

            //Nu: admin kan ge poäng
            await pointsSystem.connect(admin).assignPoints(member.address, 200);

            const memberData = await pointsSystem.members(member.address);
            expect(memberData[1]).to.equal(200); // points = 200
        })
    })

    describe("Assign Points Error Handling", function(){
        it("Should not allow non-admin to assign points", async function(){
            const { pointsSystem, member } = await deployPointsSystemFixture();

            //Registrera medlem
            await pointsSystem.connect(member).registerMember("TestUser");

            // member som inte är admin försöker ge poäng - ska misslyckas
            await expect(pointsSystem.connect(member).assignPoints(member.address,100))
            .to.be.revertedWith("Only admins can call this function")
        })

        it("Should not allow assigning points to unregistered member", async function(){
            const { pointsSystem, owner, admin , member} = await deployPointsSystemFixture();

            //Gör admin till admin
            await pointsSystem.connect(owner).assignAdmin(admin.address);

            //Admin försöker ge poäng till någon som inte är registrerad - ska misslyckas
            await expect(pointsSystem.connect(admin).assignPoints(member.address, 100))
            .to.be.revertedWith("Member not registered")
        })
    })

    describe("Transfer Points", function(){
        it("Should allow member to tranfer points to another member", async function(){
            const { pointsSystem, member, admin } = await deployPointsSystemFixture();

            //Steg 1: Registrerar båda som medlemmar (admin agerar som medlem här)
            await pointsSystem.connect(member).registerMember("Member1");
            await pointsSystem.connect(admin).registerMember("Member2");
            
            //Steg 2: Ge Member1 några poäng att överföra
            await pointsSystem.connect(member).earnPoints(100); // Member1 får 100 poäng

            //Steg 3: Member1 överför 50 poäng till Member2
            await pointsSystem.connect(member).transferPoints(admin.address, 50);

            //Steg 4: Hämta båda medlemmarnas data för verifiering
            const member1Data = await pointsSystem.members(member.address);
            const member2Data = await pointsSystem.members(admin.address);

            //Steg 5: Verifiera att överföringen fungerar korrekt
            expect(member1Data[1]).to.equal(50);
            expect(member2Data[1]).to.equal(50);

        })
    })

    describe("Transfer Points Error Handling", function(){
        it("Should not allow transfer with insufficient points", async function(){
            const { pointsSystem, member, admin } = await deployPointsSystemFixture();

            //Registrera båda medlemmar
            await pointsSystem.connect(member).registerMember("Member1");
            await pointsSystem.connect(admin).registerMember("Member2");

            //Ge Member1 bara 50 poäng
            await pointsSystem.connect(member).earnPoints(50);

            //Member1 försöker överföra 100 poäng -ska misslyckas
            await expect(pointsSystem.connect(member).transferPoints(admin.address, 100))
            .to.be.revertedWith("You don't have enough points")
        })

        it("Should not allow transfer to unregistered member", async function(){
            const { pointsSystem, admin, member } = await deployPointsSystemFixture();

            //Registrera bara Member1
            await pointsSystem.connect(member).registerMember("Member1");
            await pointsSystem.connect(member).earnPoints(100);

            //Member1 försöker skicka poäng till admin(som inte är registrerad) - ska misslyckas
            await expect(pointsSystem.connect(member).transferPoints(admin.address, 50))
            .to.be.revertedWith("Target must be registered member");
        })
    })

    describe("Redeem Reward", function (){
        it("Should allow member to redeem points for reward", async function(){
            const { pointsSystem, member } = await deployPointsSystemFixture();

            //Registrera medlem och ge poäng för att testa båda belöningar
            await pointsSystem.connect(member).registerMember("TestUser");
            await pointsSystem.connect(member).earnPoints(600);

            //Lösa in VIP-status, 500 poäng
            await pointsSystem.connect(member).redeemReward(1);

            //Kontrollera att poängen drogs av
            const memberData = await pointsSystem.members(member.address);
            expect(memberData[1]).to.equal(100); // 600-500=100kvar

            //Lösa in T-shirt, 100 poäng
            await pointsSystem.connect(member).redeemReward(0);

            const memberDataAfterTShirt = await pointsSystem.members(member.address);
            expect(memberDataAfterTShirt[1]).to.equal(0);
        })
    })
})