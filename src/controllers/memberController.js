const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const generateMemberId = require('../../utils/generateMemberId');
const determineFamilyId = require('../../utils/generateFamilyId');

// Function to generate a 4-digit family_id
function generateFamilyId() {
    return Math.floor(1000 + Math.random() * 9000);
}

// Helper function to validate member relationships
async function validateMemberRelationships(memberData, existingMember = null) {
    // 1. Validate spouse_id and family_id for married members
    if (memberData.marital_status === 'Married') {
        if (!memberData.spouse_id) {
            throw new Error("Spouse ID is mandatory for married members");
        }
        if (!memberData.family_id) {
            throw new Error("Family ID is mandatory for married members");
        }

        // Check if spouse exists and is married
        const spouse = await prisma.member.findUnique({
            where: { member_id: memberData.spouse_id },
            select: { marital_status: true, family_id: true }
        });

        if (!spouse) {
            throw new Error("Spouse not found");
        }
        if (spouse.marital_status !== 'Married') {
            throw new Error("Spouse must be married");
        }
        if (spouse.family_id !== memberData.family_id) {
            throw new Error("Husband and wife must have the same family_id");
        }
    }

    // 2. Validate unmarried members cannot have spouse_id
    if (memberData.marital_status === 'Unmarried' && memberData.spouse_id) {
        throw new Error("Unmarried members cannot have a spouse_id");
    }

    // 3. Validate father_id for unmarried members
    if (memberData.father_id) {
        const father = await prisma.member.findUnique({
            where: { member_id: memberData.father_id },
            select: { marital_status: true }
        });

        if (!father) {
            throw new Error("Father not found");
        }
        if (father.marital_status === 'Unmarried') {
            throw new Error("Unmarried members cannot be fathers");
        }
    }

    return true;
}

// Get all the members
exports.getAllMembers = async (req, res) => {
    try {
        const members = await prisma.member.findMany();
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single member by member_id
exports.getMemberById = async (req, res) => {
    try {
        const memberId = req.params.member_id;
        if (!memberId) {
            return res.status(400).json({ message: 'member_id is required' });
        }

        const member = await prisma.member.findUnique({
            where: {
                member_id: memberId,
            },
        });

        if (member) {
            res.status(200).json(member);
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all the members from specific family_id
exports.getMembersByFamilyId = async (req, res) => {
    try {
        const members = await prisma.member.findMany({
            where: {
                family_id: Number(req.params.family_id),
            },
        });
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new member
exports.createMember = async (req, res) => {
    const {
        gender,
        sub_caste,
        age,
        pincode,
        member_name,
        caste,
        marital_status,
        full_address,
        city,
        state,
        father_id,
        spouse_id,
        if_expired,
        petname,
        education,
        occupation,
        occupation_specific_sector,
        occupation_category,
        mobile_number,
        email,
        aadhaar
    } = req.body;

    try {
        const member_id = generateMemberId(gender, sub_caste, age, pincode);

        // Determine family_id
        const family_id = await determineFamilyId(spouse_id, father_id, marital_status);

        // Create member data object
        const memberData = {
            member_id,
            gender: gender ?? '',
            sub_caste: sub_caste ?? '',
            age: age ?? '',
            pincode: pincode ?? 0,
            member_name: member_name ?? '',
            caste: caste ?? '',
            marital_status: marital_status ?? '',
            full_address: full_address ?? '',
            city: city ?? '',
            state: state ?? '',
            father_id: father_id ?? '',
            spouse_id: spouse_id ?? '',
            family_id,
            if_expired: if_expired ?? '',
            petname: petname ?? '',
            education: education ?? '',
            occupation: occupation ?? '',
            occupation_specific_sector: occupation_specific_sector ?? '',
            occupation_category: occupation_category ?? '',
            mobile_number: mobile_number ?? '',
            email: email ?? '',
            aadhaar: aadhaar ?? ''
        };

        // Validate relationships
        await validateMemberRelationships(memberData);

        const newMember = await prisma.member.create({
            data: memberData
        });

        // Update the spouse's spouse_id to this member's member_id
        if (spouse_id) {
            await prisma.member.update({
                where: { member_id: spouse_id },
                data: { spouse_id: member_id }
            });
        }

        res.status(201).json(newMember);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a single member by member_id
exports.updateMember = async (req, res) => {
    const { member_id } = req.params;
    const updateData = req.body;

    try {
        // Fetch the existing member's data before updating
        const existingMember = await prisma.member.findUnique({
            where: { member_id: member_id },
            select: { 
                gender: true, 
                sub_caste: true, 
                age: true, 
                pincode: true, 
                father_id: true, 
                spouse_id: true, 
                family_id: true, 
                marital_status: true 
            }
        });

        if (!existingMember) {
            return res.status(404).json({ error: "Member not found" });
        }

        // Update family_id based on marital status changes
        if (updateData.marital_status !== existingMember.marital_status) {
            if (updateData.marital_status === 'Married') {
                // Generate new family_id when changing to Married status
                updateData.family_id = generateFamilyId();
            } else if (updateData.marital_status === 'Unmarried') {
                // For unmarried members, use father's family_id if available, otherwise null
                if (updateData.father_id) {
                    const father = await prisma.member.findUnique({
                        where: { member_id: updateData.father_id },
                        select: { family_id: true }
                    });
                    updateData.family_id = father ? father.family_id : null;
                } else {
                    updateData.family_id = null;
                }
            }
        }

        // Clean up family_id value
        if (updateData.family_id === '' || updateData.family_id === undefined) {
            updateData.family_id = null;
        } else if (updateData.family_id) {
            updateData.family_id = Number(updateData.family_id);
        }

        // Remove id from updateData as it's auto-generated
        delete updateData.id;

        // Validate relationships
        await validateMemberRelationships(updateData, existingMember);

        // Update the member with the new data
        const updatedMember = await prisma.member.update({
            where: { member_id: member_id },
            data: updateData,
        });

        // Update the spouse's spouse_id to this member's member_id
        if (updateData.spouse_id) {
            await prisma.member.update({
                where: { member_id: updateData.spouse_id },
                data: { 
                    spouse_id: member_id,
                    family_id: updateData.family_id // Ensure spouse has same family_id
                }
            });
        }

        res.status(200).json(updatedMember);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update all the members from specific family_id (Unused)
exports.updateAllMembers = async (req, res) => {
    try {
        const updatedMembers = await Promise.all(req.body.map(async (memberData) => {
            const updatedMember = await prisma.member.update({
                where: { family_id: memberData.family_id },
                data: memberData,
            });
            return updatedMember;
        }));
        
        res.status(200).json(updatedMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//Delete single member by member_id
exports.deleteMember = async (req, res) => {
    try {
        const member = await prisma.member.delete({
            where: { member_id: req.params.member_id }, // Use member_id as a string
        });
        res.status(200).json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Delete all members from specific family_id 
exports.deleteAllMembersByFamilyId = async (req, res) => {
    try {
        const deletedMembers = await prisma.member.deleteMany({
            where: { family_id: Number(req.params.family_id) },
        });
        res.status(200).json(deletedMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


