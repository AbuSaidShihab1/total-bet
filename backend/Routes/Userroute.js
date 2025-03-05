const express=require("express");
const UserModel = require("../Models/User");
const transaction_model = require("../Models/Transactionmodel");
const Withdrawmodel = require("../Models/Withdrawmodel");
const user_route=express();

// -------------------------after-play-------------------------------
user_route.put("/after-play-minus-balance",async(req,res)=>{
    try {
        const {betAmount,player_id}=req.body;
        console.log(req.body)
        const find_user=await UserModel.findOne({player_id:player_id});
        if(!find_user){
            return res.send({success:false,message:"User did not find!"})
        }
        // const update_user_balance=await UserModel.findByIdAndUpdate({_id:find_user._id});
        find_user.balance-=betAmount;
        res.send({success:true,message:"Ok"})
        find_user.save();
    } catch (err) {
        console.log(err)
    }
});
// ------------------after-win--------------------------
user_route.put("/after-wind-add-balance",async(req,res)=>{
    try {
        const {winAmount,player_id}=req.body;
        console.log(req.body)
        const find_user=await UserModel.findOne({player_id:player_id});
        if(!find_user){
            return res.send({success:false,message:"User did not find!"})
        }
        // const update_user_balance=await UserModel.findByIdAndUpdate({_id:find_user._id});
        find_user.balance+=winAmount;
        res.send({success:true,message:"Ok"})
        find_user.save();
    } catch (err) {
        console.log(err)
    }
});
// -------------------------after-withdraw-------------------------------
user_route.put("/after-withdraw-minus-balance",async(req,res)=>{
    try {
        const {amount,player_id}=req.body;
        console.log(req.body)
        const find_user=await UserModel.findOne({player_id:player_id});
        if(!find_user){
            return res.send({success:false,message:"User did not find!"})
        }
        // const update_user_balance=await UserModel.findByIdAndUpdate({_id:find_user._id});
        find_user.balance-=amount;
        res.send({success:true,message:"Ok"})
        find_user.save();
    } catch (err) {
        console.log(err)
    }
});
// -------------create-transations--------------------

user_route.post("/create-transaction", async (req, res) => {
    try {
        const {
            transiction,
            customer_id,
            payment_type,
            payment_method,
            amount,
            post_balance,
            transaction,
            type,
            status,
            updated_by,
            reason,
        } = req.body;

        // Check if transaction already exists based on a unique identifier (transaction ID)
        const existingTransaction = await transaction_model.findOne({ transaction });
          const find_user=await UserModel.findOne({_id:customer_id});
        if (existingTransaction) {
            return res.json({ message: "Transaction already exists." });
        }

        // Create a new transaction
        const newTransaction = new transaction_model({
            transiction,
            customer_id,
            customer_name:find_user.name,
            customer_email:find_user.email,
            payment_type,
            payment_method,
            amount,
            post_balance,
            transaction,
            type: type || "deposit", // default type is 'deposit'
            status,
            updated_by: updated_by || "", // default empty string for updated_by
            reason,
        });

        // Save the new transaction to the database
        await newTransaction.save();

        return res.status(201).json({ message: "Transaction created successfully.", transaction: newTransaction });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error, please try again later." });
    }
});


// --------------single-user-transaction-data---------------------
user_route.get("/single-user-transactions/:id",async(req,res)=>{
    try {
        const transaction_data=await transaction_model.find({customer_id:req.params.id}).sort({ createdAt: -1 });
        if(!transaction_data){
            return res.send({success:false,message:"Transaction not found!"})
        };
        res.send({success:true,data:transaction_data})
    } catch (error) {
        console.log(error)
    }
});
// ----------------withdrawal-history------------------------
// Create a withdrawal request
user_route.post("/payout", async (req, res) => {
    try {
      const { userId,username,email,playerId,provider, amount, orderId, payeeAccount,post_balance,recieved_amount,tax_amount } = req.body;
      console.log(req.body)
      // Validate the user
      const user = await UserModel.findById(userId);
      if (!user) return res.status(400).json({ success: false, message: "User not found." });
  
      // Check balance
      if (user.balance < amount) {
        return res.status(400).json({ success: false, message: "Insufficient balance." });
      }
  
      // Create withdrawal request
      const newWithdrawal = new Withdrawmodel({
        userId,
        provider,
        amount,
        orderId,
        payeeAccount,
        name:username,
        email,
        playerId,
        post_balance,
        recieved_amount,
        tax_amount
      });
  
      await newWithdrawal.save();
  
      // Deduct balance
      user.balance -= amount;
      user.transactions+=1;
      await user.save();
  
      res.json({ success: true, message: "Withdrawal request submitted!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error." });
    }
  });
  
  // Get user's withdrawals
user_route.get("/withdrawal/:userId", async (req, res) => {
    try {
      const withdrawals = await Withdrawmodel.find({ userId: req.params.userId });
      res.send({success:true,data:withdrawals});
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error." });
    }
});
  
  // Admin approves/rejects a withdrawal
user_route.put("/update/:id", async (req, res) => {
    try {
      const { status } = req.body;
      const withdrawal = await Withdrawmodel.findById(req.params.id);
  
      if (!withdrawal) return res.status(404).json({ success: false, message: "Withdrawal not found." });
  
      withdrawal.status = status;
      await withdrawal.save();
  
      res.json({ success: true, message: `Withdrawal ${status}.` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error." });
    }
  });
module.exports=user_route;
