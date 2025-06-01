const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Function to generate a 4-digit family_id
function generateFamilyId() {
    return Math.floor(1000 + Math.random() * 9000);
}

// Function to determine family_id based on relationships
async function determineFamilyId(spouse_id, father_id, marital_status) {
    let family_id = null;

    if (spouse_id) {
        // Check if the spouse already has a family_id
        const spouse = await prisma.member.findUnique({
            where: { member_id: spouse_id },
            select: { family_id: true }
        });

        if (spouse && spouse.family_id) {
            family_id = spouse.family_id;
        } else {
            family_id = generateFamilyId();
        }
    } else if (father_id && marital_status === 'Unmarried') {
        // Check if the father already has a family_id
        const father = await prisma.member.findUnique({
            where: { member_id: father_id },
            select: { family_id: true }
        });

        if (father && father.family_id) {
            family_id = father.family_id;
        } else {
            family_id = generateFamilyId();
        }
    } else if (marital_status === 'Unmarried' && !father_id) {
        // Set family_id to null for an unmarried member with no father_id
        family_id = null;
    } else {
        family_id = generateFamilyId();
    }

    return family_id;
}

module.exports = determineFamilyId;