import { Form, Head } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="Log in" />
            <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus,
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px white inset !important;
                    -webkit-text-fill-color: #111827 !important;
                }
            `}</style>

            <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center px-4 pb-20">
                <div className="w-full max-w-md">
                    {/* Logo + Branding */}
                    <div className="flex flex-col items-center gap-3 mb-8">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#0d1b2a' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-9 h-9" fill="#f5a623">
                                <ellipse cx="32" cy="36" rx="14" ry="18" />
                                <ellipse cx="32" cy="18" rx="8" ry="9" />
                                <line x1="32" y1="27" x2="32" y2="18" stroke="#0d1b2a" strokeWidth="2" />
                                <ellipse cx="20" cy="30" rx="10" ry="5" fill="#f5a623" fillOpacity="0.6" transform="rotate(-30 20 30)" />
                                <ellipse cx="44" cy="30" rx="10" ry="5" fill="#f5a623" fillOpacity="0.6" transform="rotate(30 44 30)" />
                                <line x1="24" y1="36" x2="40" y2="36" stroke="#0d1b2a" strokeWidth="2" />
                                <line x1="22" y1="42" x2="42" y2="42" stroke="#0d1b2a" strokeWidth="2" />
                                <line x1="26" y1="48" x2="38" y2="48" stroke="#0d1b2a" strokeWidth="2" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h2 className="text-4xl font-bold tracking-tight" style={{ color: '#0d1b2a' }}>Welcome Back</h2>
                            <p className="text-base text-gray-400 mt-1.5">Sign in to access the admin dashboard</p>
                        </div>
                    </div>

                    {/* Login Card */}
                    <div 
                        className="w-full bg-white rounded-[20px] border border-gray-100 p-8 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
                        style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}
                    >
                        {status && (
                            <div className="mb-6 text-center text-sm font-medium text-green-600 bg-green-50 p-3 rounded-xl">
                                {status}
                            </div>
                        )}

                        <Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-5">
                            {({ processing, errors }) => (
                                <>
                                    {/* Email Field */}
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="email" className="text-sm font-medium" style={{ color: '#0d1b2a' }}>
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="you@example.com"
                                                className="w-full h-[52px] pl-12 pr-4 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 focus:scale-[1.01]" style={{ color: '#0d1b2a' }}
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    {/* Password Field */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="password" className="text-sm font-medium" style={{ color: '#0d1b2a' }}>
                                                Password
                                            </label>
                                            {canResetPassword && (
                                                <TextLink href={request()} tabIndex={5} className="text-sm font-medium text-[#F59E0B] hover:text-[#D97706] transition-colors hover:underline underline-offset-4">
                                                    Forgot Password?
                                                </TextLink>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                className="w-full h-[52px] pl-12 pr-12 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 focus:scale-[1.01]" style={{ color: '#0d1b2a' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                tabIndex={3}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    {/* Remember Me */}
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                            id="remember"
                                            className="w-5 h-5 rounded border-[#E5E7EB] text-[#F59E0B] focus:ring-[#F59E0B]"
                                        />
                                        <label htmlFor="remember" className="text-sm font-medium text-gray-400 cursor-pointer">
                                            Remember Me
                                        </label>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        tabIndex={4}
                                        disabled={processing}
                                        className={cn(
                                            "w-full h-[54px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-sm disabled:cursor-not-allowed",
                                            processing
                                                ? "bg-[#F59E0B]/80"
                                                : "bg-[#F59E0B] hover:bg-[#D97706] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
                                        )}
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Signing in...
                                            </>
                                        ) : (
                                            "Sign In"
                                        )}
                                    </button>

                                    {/* Sign up */}
                                    {canRegister && (
                                        <p className="text-center text-sm text-gray-400 mt-4">
                                            Don't have an account?{' '}
                                            <TextLink href={register()} tabIndex={6} className="font-semibold text-[#F59E0B] hover:text-[#D97706] transition-colors hover:underline underline-offset-4">
                                                Sign up
                                            </TextLink>
                                        </p>
                                    )}
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
}
