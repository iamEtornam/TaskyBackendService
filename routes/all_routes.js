const { Router } = require("express");
const router = Router();
const userController = require("../controllers/user_controller");
const taskController = require("../controllers/task_controller");
const organizationController = require("../controllers/organization_controller");
const inboxController = require("../controllers/inbox_controller");
const { checkHealth } = require("../controllers/health_controller");

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
router.patch("/updateTask/:id", taskController.updateTask);
router.get("/getTaskStatusCount/:userId", taskController.getTaskStatusCount);
router.post("/createInbox", inboxController.createInbox);
router.get("/getUserInbox/:userId", inboxController.getUserInbox);
router.get(
  "/getUserInboxComment/:inboxId",
  inboxController.getUserInboxComment
);
/* GET health status */
router.get("/heart-beat", checkHealth);

module.exports = router;
