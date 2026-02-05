const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
firstName: {
type: String,
required: [true, 'First name is required'],
trim: true,
},
lastName: {
type: String,
required: [true, 'Last name is required'],
trim: true,
},
email: {
type: String,
required: [true, 'Email is required'],
unique: true,
lowercase: true,
trim: true,
match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
},
password: {
type: String,
required: [true, 'Password is required'],
minlength: 6,
select: false,
},

// 🔐 Rôle global - IMPORTANT : pas de default !!!
role: {
type: String,
enum: ['admin', 'member', 'superadmin'], // ✅ AJOUT superadmin
default: undefined,
},

avatar: {
type: String,
default: null,
},
bio: {
type: String,
maxlength: 500,
default: '',
},
phone: {
type: String,
default: '',
},
teams: [
{
type: mongoose.Schema.Types.ObjectId,
ref: 'Team',
},
],
isActive: {
type: Boolean,
default: true,
},
lastLogin: {
type: Date,
default: null,
},
}, {
timestamps: true,
});

// Hash password
userSchema.pre('save', async function (next) {
if (!this.isModified('password')) return next();
try {
const salt = await bcrypt.genSalt(10);
this.password = await bcrypt.hash(this.password, salt);
next();
} catch (err) {
next(err);
}
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
return bcrypt.compare(candidatePassword, this.password);
};

// Virtual fullName
userSchema.virtual('fullName').get(function () {
return `${this.firstName} ${this.lastName}`;
});

// Clean output
userSchema.set('toJSON', {
virtuals: true,
transform: (doc, ret) => {
delete ret.password;
delete ret.__v;
return ret;
},
});

module.exports = mongoose.model('User', userSchema);
