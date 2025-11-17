const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserSchema = new mongoose.Schema(
 {
   firstName: { type: String, required: true },
   lastName: { type: String, required: true },
   email: { type: String, unique: true, required: true },
   password: { type: String, required: true },
   phone: { type: String },
   bio: { type: String },
   teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
   lastLogin: Date
 },
 { timestamps: true }
);
UserSchema.pre('save', async function (next) {
 if (!this.isModified('password')) return next();
 this.password = await bcrypt.hash(this.password, 10);
 next();
});
UserSchema.methods.matchPassword = async function (password) {
 return await bcrypt.compare(password, this.password);
};
module.exports = mongoose.model('User', UserSchema);
