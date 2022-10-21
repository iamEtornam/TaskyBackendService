const express = require("express");
const router = express.Router();
const userController = require("../controllers/user_controller");
const taskController = require("../controllers/task_controller");
const organizationController = require("../controllers/organization_controller");

/* GET home page. */
router.get("/heart-beat", function (req, res, next) {
  return res.send('Alive and kicking...');
});

router.post("/login", userController.login);
router.get("/getOrganizations", organizationController.getOrganizations);
router.get(
  "/getOrganizationById/:id",
  organizationController.getOrganizationById
);
router.patch("/updateUserTeam", organizationController.updateUserTeam);
router.patch("/updateUserToken", userController.updateUserToken);
router.patch("/updateUserInformation", userController.updateUserInformation);
router.post("/inviteMembers", organizationController.inviteMembers);
router.post("/createOrganization", organizationController.createOrganization);
router.get("/getUserInformation", userController.getUserInformation);
router.post("/createTask", taskController.createTask);
router.get("/listMembers/:organizationId", organizationController.listMembers);
router.get("/getTasks/:organizationId", taskController.getTasks);
router.patch("/updateTask/:userId", taskController.updateTask);
router.get("/getTaskStatusCount/:userId", taskController.getTaskStatusCount);
router.get("/getUserInbox/:userId", taskController.getUserInbox);
router.get("/getUserInboxComment/:inboxId", taskController.getUserInboxComment);

module.exports = router;
