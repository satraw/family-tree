const express = require('express');
const memberController = require('../controllers/memberController');
const router = express.Router();

// Member routes

router.get('/members', memberController.getAllMembers);
router.get('/members/:member_id', memberController.getMemberById);
router.get('/members/family/:family_id', memberController.getMembersByFamilyId);
router.post('/members', memberController.createMember);
router.put('/members/:member_id', memberController.updateMember);
router.put('/members/family/:family_id', memberController.updateAllMembers); //unsed
router.delete('/members/:member_id', memberController.deleteMember);
router.delete('/members/family/:family_id', memberController.deleteAllMembersByFamilyId);

module.exports = router;
