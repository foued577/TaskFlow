import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';

// ✅ ✅ ✅ AJOUT LOGO (doit exister dans: frontend/src/assets/logotaskflow.png)
import taskflowLogo from '../assets/logotaskflow.png';

const Login = () => {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const { login } = useAuth();
const navigate = useNavigate();

const handleSubmit = async (e) => {
e.preventDefault();
setLoading(true);

const success = await login(email, password);
if (success) {
navigate('/');
}

setLoading(false);
};

return (
<div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4">
{/* ✅ ✅ ✅ BACKGROUND LIKE YOUR IMAGE */}
<div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500" />
<div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-white/10 rounded-full blur-3xl" />
<div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] bg-black/10 rounded-full blur-3xl" />
<div className="absolute top-20 right-32 w-[380px] h-[380px] bg-white/10 rounded-full blur-3xl" />

<div className="relative max-w-md w-full">
<div className="bg-white rounded-2xl shadow-2xl p-8">
<div className="text-center mb-8">
{/* ✅ ✅ ✅ LOGO */}
<div className="flex items-center justify-center mb-4">
<img
src={taskflowLogo}
alt="TaskFlow"
className="h-16 w-auto"
draggable={false}
/>
</div>

<h1 className="text-3xl font-bold text-gray-900 mb-2">TaskFlow</h1>
<p className="text-gray-600">Connectez-vous à votre compte</p>
</div>

<form onSubmit={handleSubmit} className="space-y-6">
<div>
<label className="block text-sm font-medium text-gray-700 mb-2">
Email
</label>
<div className="relative">
<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
<input
type="email"
value={email}
onChange={(e) => setEmail(e.target.value)}
className="input pl-10"
placeholder="votre@email.com"
required
/>
</div>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-2">
Mot de passe
</label>
<div className="relative">
<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
<input
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
className="input pl-10"
placeholder="••••••••"
required
/>
</div>
</div>

<button
type="submit"
disabled={loading}
className="w-full btn btn-primary flex items-center justify-center"
>
{loading ? (
<>
<Loader2 className="w-5 h-5 mr-2 animate-spin" />
Connexion...
</>
) : (
<>
<LogIn className="w-5 h-5 mr-2" />
Se connecter
</>
)}
</button>
</form>

<div className="mt-6 text-center">
<p className="text-sm text-gray-600">
Pas encore de compte ?{' '}
<Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
Créer un compte
</Link>
</p>
</div>
</div>
</div>
</div>
);
};

export default Login;
