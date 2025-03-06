const express=require("express");
const UserModel = require("../Models/User");
const transaction_model = require("../Models/Transactionmodel");
const admin_route=express();
const nodemailer=require("nodemailer");
const notification_model = require("../Models/Usernotification");
const Withdrawmodel = require("../Models/Withdrawmodel");
const admin_model = require("../Models/Adminmodel");

// ------------------all-information---------------------
admin_route.get("/all-coutation",async(req,res)=>{
  try {
     const pending_withdraw=await Withdrawmodel.find({status:"in review"}).countDocuments();
     const approved_withdraw=await Withdrawmodel.find({status:"approved"}).countDocuments();
     const rejected_withdraw=await Withdrawmodel.find({status:"rejected"}).countDocuments();
     const all_withdraw=await Withdrawmodel.find().countDocuments();
    //  -------------------------deposit------------------------------
    const pending_deposit=await transaction_model.find({status:"failed"}).countDocuments();
    const success_deposit=await transaction_model.find({status:"success"}).countDocuments();
    const all_deposit=await transaction_model.find().countDocuments();
     res.send({success:true,pending_withdraw,approved_withdraw,rejected_withdraw,all_withdraw,pending_deposit,success_deposit,all_deposit})
  } catch (error) {
    console.log(error)
  }
})
// ========================users===================================
admin_route.get("/all-users",async(req,res)=>{
    try {
       const all_users=await UserModel.find();
       if(!all_users){
           return res.send({success:false,message:"Users Not found!"})   
       }
       res.send({success:true,message:"Active users",data:all_users})
    } catch (error) {
        console.log(error)
    }
});
admin_route.get("/active-users",async(req,res)=>{
    try {
       const active_user=await UserModel.find({status:"active"});
       if(!active_user){
           return res.send({success:false,message:"Active Users Not found!"})   
       }
       res.send({success:true,message:"Active users",data:active_user})
    } catch (error) {
        console.log(error)
    }
});
admin_route.get("/banned-users",async(req,res)=>{
    try {
       const banned_user=await UserModel.find({status:"banned"});
       if(!banned_user){
           return res.send({success:false,message:"Banned Users Not found!"})   
       }
       res.send({success:true,message:"Active users",data:banned_user})
    } catch (error) {
        console.log(error)
    }
});
admin_route.get("/single-user-details/:id",async(req,res)=>{
    try {
       const user_detail=await UserModel.findOne({_id:req.params.id});
       if(!user_detail){
           return res.send({success:false,message:"User Not found!"})   
       }
       res.send({success:true,message:"Ok",data:user_detail})
    } catch (error) {
        console.log(error)
    }
});
admin_route.put("/add-user-balance/:id",async(req,res)=>{
    try {
        const {amount}=req.body;
        const find_user=await UserModel.findOne({_id:req.params.id});
        if(!find_user){
          return res.send({success:false,message:"User did not find!"})
        }
        find_user.balance+=amount;
        const update_deposit_money=await UserModel.findByIdAndUpdate({_id:find_user._id},{$set:{deposit_money:amount}})
        find_user.save();
       res.send({success:true,message:`${amount} BDT has been added to ${find_user.name}'s account!`})
    } catch (error) {
        console.log(error)
    }
});
admin_route.put("/subtract-user-balance/:id", async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).send({ success: false, message: "Invalid amount!" });
        }

        const find_user = await UserModel.findOne({ _id: req.params.id });

        if (!find_user) {
            return res.status(404).send({ success: false, message: "User not found!" });
        }

        if (find_user.balance < amount) {
            return res.status(400).send({ success: false, message: "Insufficient balance!" });
        }

        find_user.balance -= amount;
        await find_user.save();

        res.send({ 
            success: true, 
            message: `${amount} BDT has been subtracted from ${find_user.name}'s account!` 
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Something went wrong!" });
    }
});

admin_route.put("/banned-user/:id",async(req,res)=>{
    try {
        const find_user=await UserModel.findOne({_id:req.params.id});
        if(!find_user){
          return res.send({success:false,message:"User did not find!"})
        }
        const banned_user=await UserModel.findByIdAndUpdate({_id:req.params.id},{$set:{status:"banned",reason:req.body.reason}});
       res.send({success:true,message:`${find_user.name}'s account has been banned!`})
    } catch (error) {
        console.log(error)
    }
})
admin_route.put("/unban-user/:id",async(req,res)=>{
    try {
        const find_user=await UserModel.findOne({_id:req.params.id});
        if(!find_user){
          return res.send({success:false,message:"User did not find!"})
        }
        const unban_user=await UserModel.findByIdAndUpdate({_id:req.params.id},{$set:{status:"active",reason:req.body.reason}});
       res.send({success:true,message:`${find_user.name}'s account has been banned!`})
    } catch (error) {
        console.log(error)
    }
})
// ========================users=================================

// ---------------------send-notification------------------------------

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "shihabmoni15@gmail.com", // Your email address
        pass: "kxyb btad rldf fpsn", // Your email password or app password
    },
});

// Send Notification Route
admin_route.post("/send-notification", async (req, res) => {
  try {
    const { recipients, subject, message, sendViaEmail } = req.body;

    if (!recipients || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    let recipientEmails = [];

    // If "All Users" is selected, fetch all user emails from DB
    if (recipients === "All Users") {
      const users = await UserModel.find({}, "email"); // Fetch all users' emails
      recipientEmails = users.map(user => user.email);
    } else {
      recipientEmails = [recipients]; // Single recipient email
    }

    // Save Notification in Database
    const newNotification = new notification_model({ recipients: recipientEmails, subject, message, sentViaEmail: sendViaEmail });
    await newNotification.save();

    // If email sending is enabled
    if (sendViaEmail && recipientEmails.length > 0) {
        const mailOptions = {
            from: "shihabmoni15@gmail.com",
            to: recipientEmails.join(","), // Convert array to comma-separated string
            subject,
            html: `
              <div style="
                max-width: 600px;
                margin: 0 auto;
                font-family: 'Arial', sans-serif;
                text-align: center;
              ">
                <!-- Header with Black Background -->
                <div style="
                  background: black;
                  color: white;
                  padding: 15px;
                  font-size: 24px;
                  font-weight: bold;
                ">
                  Ho<span class="text-orange-500">Bet</span>
                </div>
          
                <!-- Notification Box -->
                <div style="
                  background: white;
                  color: #333;
                  padding: 20px;
                  margin-top: 10px;
                  border-radius: 8px;
                  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
                  text-align: left;
                ">
                  <h2 style="font-size: 22px; margin-bottom: 10px; text-align: center;">${subject}</h2>
                  <p style="line-height: 1.6; font-size: 16px;">${message}</p>
                </div>
          
                <!-- Footer -->
                <p style="margin-top: 15px; font-size: 14px; opacity: 0.8;">Best Regards,</p>
                <p style="margin: 0; font-size: 16px; font-weight: bold;">HoBet Team</p>
              </div>
            `,
          };
          
      await transporter.sendMail(mailOptions);
    }

    res.status(201).json({ success: true, message: "Notification sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
admin_route.get("/notifications/:email", async (req, res) => {
    try {
      const { email } = req.params;
  
      // Find notifications where:
      // - The user's email exists in the recipients array
      // - OR The notification is for all users (null recipients array)
      const notifications = await notification_model
        .find({ recipients: { $in: [email] } }) // Check if email exists in recipients array
        .sort({ createdAt: -1 });
  
      res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
  
  admin_route.delete("/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find and delete the notification by ID
      const deletedNotification = await notification_model.findByIdAndDelete(id);
  
      if (!deletedNotification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
  
      res.status(200).json({ success: true, message: "Notification deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
// Get all notifications with search and date filtering
admin_route.get("/notification-history", async (req, res) => {
  try {
    const { search, date, email } = req.query;
    let filter = {};

    // 🔹 Search filter
    if (search) {
      filter.$or = [
        { "recipients": { $regex: search, $options: "i" } },
        { "subject": { $regex: search, $options: "i" } },
        { "message": { $regex: search, $options: "i" } }
      ];
    }

    // 🔹 Email filter (for recipients array)
    if (email) {
      filter.recipients = { $in: [email] }; // Matches if the email is inside the recipients array
    }

    // 🔹 Date filter
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    // 🔹 Fetch notifications with sorting
    const notifications = await notification_model.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


// ========================deposit-transactions=============================
admin_route.get("/failed-deposit",async(req,res)=>{
    try {
        const pending_deposit=await transaction_model.find({status:"failed"}).sort({ createdAt: -1 });
        if(!pending_deposit){
            return res.send({success:false,message:"Transaction not found!"})
        };
        res.send({success:true,data:pending_deposit})
    } catch (error) {
        console.log(error)
    }
});
admin_route.get("/successful-deposit",async(req,res)=>{
    try {
        const success_deposit=await transaction_model.find({status:"success"}).sort({ createdAt: -1 });
        if(!success_deposit){
            return res.send({success:false,message:"Transaction not found!"})
        };
        res.send({success:true,data:success_deposit})
    } catch (error) {
        console.log(error)
    }
});
admin_route.get("/all-deposits",async(req,res)=>{
    try {
        const all_deposit=await transaction_model.find().sort({ createdAt: -1 });
        if(!all_deposit){
            return res.send({success:false,message:"Transaction not found!"})
        };
        res.send({success:true,data:all_deposit})
    } catch (error) {
        console.log(error)
    }
});
admin_route.get("/single-deposit/:id",async(req,res)=>{
  try {
      const single_deposit=await transaction_model.findById({_id:req.params.id})
      if(!single_deposit){
          return res.send({success:false,message:"Transaction not found!"})
      };
      res.send({success:true,data:single_deposit})
  } catch (error) {
      console.log(error)
  }
});
// Get single user's deposit history
admin_route.get("/single-user-deposits/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    let query = { customer_id: id };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const deposits = await transaction_model.find(query).sort({ createdAt: -1 });

    if (!deposits.length) {
      return res.json({ success: false, message: "No deposits found!" });
    }

    res.json({ success: true, data: deposits });
  } catch (error) {
    console.error("Error fetching deposit history:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// --------------------------withdrawal--------------------------
admin_route.get("/pending-withdrawal",async(req,res)=>{
  try {
      const pending_deposit=await Withdrawmodel.find({
        status:"in review"
      }).sort({ createdAt: -1 });
      if(!pending_deposit){
          return res.send({success:false,message:"Transaction not found!"})
      };
      res.send({success:true,data:pending_deposit})
  } catch (error) {
      console.log(error)
  }
});
admin_route.get("/approved-withdrawal",async(req,res)=>{
  try {
      const success_deposit=await Withdrawmodel.find({status:"approved"}).sort({ createdAt: -1 });
      if(!success_deposit){
          return res.send({success:false,message:"Transaction not found!"})
      };
      res.send({success:true,data:success_deposit})
  } catch (error) {
      console.log(error)
  }
});
admin_route.get("/rejected-withdrawal",async(req,res)=>{
  try {
      const rejected_withdraw=await Withdrawmodel.find({status:"rejected"}).sort({ createdAt: -1 });
      if(!rejected_withdraw){
          return res.send({success:false,message:"Transaction not found!"})
      };
      res.send({success:true,data:rejected_withdraw})
  } catch (error) {
      console.log(error)
  }
});
admin_route.get("/success-withdrawal",async(req,res)=>{
  try {
      const rejected_withdraw=await Withdrawmodel.find({status:"success"}).sort({ createdAt: -1 });
      if(!rejected_withdraw){
          return res.send({success:false,message:"Transaction not found!"})
      };
      res.send({success:true,data:rejected_withdraw})
  } catch (error) {
      console.log(error)
  }
});
admin_route.get("/all-withdrawals",async(req,res)=>{
  try {
      const all_deposit=await Withdrawmodel.find().sort({ createdAt: -1 });
      if(!all_deposit){
          return res.send({success:false,message:"Transaction not found!"})
      };
      res.send({success:true,data:all_deposit})
  } catch (error) {
      console.log(error)
  }
});
admin_route.get("/single-withdraw/:id",async(req,res)=>{
  try {
      const single_withdraw=await Withdrawmodel.findById({_id:req.params.id})
      if(!single_withdraw){
          return res.send({success:false,message:"Transaction not found!"})
      };
      res.send({success:true,data:single_withdraw})
  } catch (error) {
      console.log(error)
  }
});
admin_route.get("/all-transactions", async (req, res) => {
  try {
      // Fetch deposits and withdrawals
      const deposits = await transaction_model.find();
      const withdrawals = await Withdrawmodel.find();

      // Merge both arrays
      const allTransactions = [...deposits, ...withdrawals];

      // Sort transactions by `createdAt` in descending order (latest first)
      allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.send({ success: true, data: allTransactions });
  } catch (error) {
      console.error(error);
      res.status(500).send({ success: false, message: "Server error!" });
  }
});
// PUT route to update the status of a transaction
// admin_route.put('/update-deposit-status/:id', async (req, res) => {
//   const { status, reason, updated_by } = req.body;
//   const { id } = req.params; // Transaction ID from the URL parameter

//   // Custom Validation
//   if (!status || !['pending', 'success', 'failed'].includes(status)) {
//     return res.status(400).json({ message: 'Invalid status. Must be "pending", "success", or "failed".' });
//   }

//   if (!reason || reason.trim() === '') {
//     return res.status(400).json({ message: 'Reason is required and cannot be empty.' });
//   }

//   if (!updated_by || updated_by.trim() === '') {
//     return res.status(400).json({ message: 'Updated by field is required and cannot be empty.' });
//   }

//   try {
//     // Find the transaction by ID
//     const transaction = await transaction_model.findById(id);
    
//     if (!transaction) {
//       return res.status(404).json({ message: 'Transaction not found' });
//     }

//     // Update the status and reason
//     transaction.status = status;
//     transaction.reason = reason;
//     transaction.updated_by = updated_by;
//     const find_user=await UserModel.findOne({email:transaction.customer_email});
//     if(status=="success"){
//       find_user.balance+=transaction.amount;
//       find_user.save();
//     }

//     // Save the updated transaction
//     await transaction.save();

//     // Send success response
//     return res.status(200).json({
//       success: true,
//       message: 'Transaction status updated successfully',
//       data: transaction,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// Get Withdraw History
admin_route.get("/single-user-withdraws/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { userId };

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const withdraws = await Withdrawmodel.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: withdraws });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

admin_route.put("/withdrawals/:withdrawalId/status", async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status } = req.body;

    // Allowed status values
    const validStatuses = ["pending", "in review","assigned","success","approved", "rejected"];

    // Validate the new status
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    // Find and update the withdrawal status
    const updatedWithdrawal = await Withdrawmodel.findByIdAndUpdate(
      withdrawalId,
      { status },
      { new: true }
    );

    if (!updatedWithdrawal) {
      return res.status(404).json({ message: "Withdrawal not found." });
    }

    res.json({ message: "Withdrawal status updated successfully.", withdrawal: updatedWithdrawal });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});
// Update withdrawal status
admin_route.put("/withdrawals/:withdrawalId/status", async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status } = req.body;

    // Allowed status values
    const validStatuses = ["pending", "in review","assigned","success","approved", "rejected"];

    // Validate the new status
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    // Find and update the withdrawal status
    const updatedWithdrawal = await Withdrawmodel.findByIdAndUpdate(
      withdrawalId,
      { status },
      { new: true }
    );

    if (!updatedWithdrawal) {
      return res.status(404).json({ message: "Withdrawal not found." });
    }

    res.json({ message: "Withdrawal status updated successfully.", withdrawal: updatedWithdrawal });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});
admin_route.post("/withdrawals-take", async (req, res) => {
  try {
    console.log(req.body)
     const find_withdraw=await Withdrawmodel.findOne({orderId:req.body.orderId})
     if(!find_withdraw){
        return res.send({success:false,message:"Withdraw id not found!"});
        console.log("ok")
     }
     const update_status=await Withdrawmodel.findByIdAndUpdate({_id:find_withdraw._id},{$set:{status:req.body.status}})
      console.log(update_status);
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});
// -------------------------report-------------------------
// ===========================================login history===========================
admin_route.get('/login-history', async (req, res) => {
  try {
      const { username, startDate, endDate } = req.query;
      let query = {};

      // Apply username search if provided
      if (username) {
          query["name"] = { $regex: username, $options: "i" }; // Case-insensitive search
      }

      const users = await UserModel.find(query, 'name email loginHistory').lean();

      // Ensure loginHistory exists and is an array
      const loginHistory = users.flatMap(user => 
          (user.loginHistory || []).map(history => ({
              name: user.name,
              email: user.email,
              ipAddress: history.ipAddress,
              device: history.device,
              location: history.location,
              loginAt: history.loginAt || new Date()
          }))
      );

      // Apply date filtering after extracting login history
      let filteredHistory = loginHistory;
      if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          filteredHistory = loginHistory.filter(history =>
              history.loginAt >= start && history.loginAt <= end
          );
      }

      res.status(200).json({ success: true, data: filteredHistory });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error fetching login history' });
  }
});
// -------------moderator---------------------------
admin_route.get("/all-admins",async(req,res)=>{
  try {
     const all_admins=await admin_model.find({role:"admin",is_admin:true});
     if(!all_admins){
         return res.send({success:false,message:"Active admin Not found!"})   
     }
     res.send({success:true,message:"Active users",data:all_admins})
  } catch (error) {
      console.log(error)
  }
});
admin_route.get("/all-super-admins",async(req,res)=>{
  try {
     const all_admins=await admin_model.find({role:"super-admin",is_admin:true});
     if(!all_admins){
         return res.send({success:false,message:"Active admin Not found!"})   
     }
     res.send({success:true,message:"Active users",data:all_admins})
  } catch (error) {
      console.log(error)
  }
});
admin_route.get("/pending-admins",async(req,res)=>{
  try {
     const pending_admins=await admin_model.find({is_admin:false});
     if(!pending_admins){
         return res.send({success:false,message:"Active admin Not found!"})   
     }
     res.send({success:true,message:"Pending admins",data:pending_admins})
  } catch (error) {
      console.log(error)
  }
});
// -----------chnage-admin-status------------------
admin_route.put("/admin-status-update/:id",async(req,res)=>{
  try {
      const admin_find=await admin_model.findOne({_id:req.params.id});
      if(!admin_find){
        return res.send({success:false,message:"Admin did not find!"})
      }
      const update_status=await admin_model.findByIdAndUpdate({_id:req.params.id},{$set:{status:req.body.status}});
     res.send({success:true,message:`${admin_find.name}'s account has been banned!`})
  } catch (error) {
      console.log(error)
  }
})
module.exports=admin_route;