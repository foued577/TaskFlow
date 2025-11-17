const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserSchema = new mongoose.Schema(
 {
   firstName: { type: String, required: true },
   lastName: { type: String, required: true },
   email: { type: String, required: true, unique: true },
   password: { type: String, required: true },
   phone: String,
   bio: String,
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
 return bcrypt.compare(password, this.password);
};
module.exports = mongoose.model('User', UserSchema);
