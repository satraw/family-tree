function generateMemberId(gender, subCaste, age, pincode) {
    const genderMap = {
        'm': 'm',
        'male': 'm',
        'f': 'f',
        'female': 'f'
    };

    const genderAbbr = genderMap[gender.toLowerCase()];
    if (!genderAbbr) {
        throw new Error("Gender must be 'm', 'f', 'male', or 'female'");
    }

    if (isNaN(age) || age < 0) {
        throw new Error("Age must be a non-negative number");
    }

    if (!/^\d{6}$/.test(pincode)) {
        throw new Error("Pincode must be a 6-digit number");
    }

    const randomNumber = Math.floor(100 + Math.random() * 900);
    const subCastePrefix = subCaste.substring(0, 3).toLowerCase(); // Use only the first 3 letters of subCaste
    const memberId = `${genderAbbr}-${subCastePrefix}-${age}-${pincode}-${randomNumber.toString().padStart(3, '0')}`;

    return memberId;
}

module.exports = generateMemberId;