import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { login } from '@/routes';
import { update } from '@/routes/password';
import { cn } from '@/lib/utils';

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <>
            <Head title="Reset Password" />
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
                            <h2 className="text-4xl font-bold tracking-tight" style={{ color: '#0d1b2a' }}>Reset Password</h2>
                            <p className="text-base text-gray-400 mt-1.5">
                                Please enter your new password below
                            </p>
                        </div>
                    </div>

                    {/* Reset Password Card */}
                    <div 
                        className="w-full bg-white rounded-[20px] border border-gray-100 p-8 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
                        style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}
                    >
                        <Form
                            {...update.form()}
                            transform={(data) => ({ ...data, token, email })}
                            resetOnSuccess={['password', 'password_confirmation']}
                            className="flex flex-col gap-5"
                        >
                            {({ processing, errors }) => (
                                <>
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
                                                autoComplete="email"
                                                value={email}
                                                readOnly
                                                className="w-full h-[52px] pl-12 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none" style={{ color: '#0d1b2a' }}
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="password" className="text-sm font-medium" style={{ color: '#0d1b2a' }}>
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                autoComplete="new-password"
                                                autoFocus
                                                placeholder="••••••••"
                                                className="w-full h-[52px] pl-12 pr-12 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 focus:scale-[1.01]" style={{ color: '#0d1b2a' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="password_confirmation" className="text-sm font-medium" style={{ color: '#0d1b2a' }}>
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                id="password_confirmation"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="password_confirmation"
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                className="w-full h-[52px] pl-12 pr-12 text-sm bg-white border border-[#E5E7EB] rounded-xl outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 focus:scale-[1.01]" style={{ color: '#0d1b2a' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password_confirmation} />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        data-test="reset-password-button"
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
                                                Resetting...
                                            </>
                                        ) : (
                                            "Reset Password"
                                        )}
                                    </button>

                                    <p className="text-center text-sm text-gray-400 mt-4">
                                        Remember your password?{' '}
                                        <TextLink href={login()} className="font-semibold text-[#F59E0B] hover:text-[#D97706] transition-colors hover:underline underline-offset-4">
                                            Sign In
                                        </TextLink>
                                    </p>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Please enter your new password below',
};
