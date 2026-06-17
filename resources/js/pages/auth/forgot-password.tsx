import { Form, Head } from '@inertiajs/react';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot Password" />

            <div
                className="min-h-screen w-full flex flex-col items-center justify-center px-4"
                style={{ backgroundColor: '#f0ede8' }}
            >
                {/* Logo + App name */}
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0d1b2a' }}>
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
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#0d1b2a' }}>BSADS</h1>
                    <p className="text-sm" style={{ color: '#6b7280' }}>Bee Swarming &amp; Abscondence Detection System</p>
                </div>

                {/* Card */}
                <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
                    <div className="mb-5">
                        <h2 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>Reset Password</h2>
                        <div className="mt-2 h-1 w-10 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                            Enter your email address and we will send you a password reset link.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>
                    )}

                    <Form {...email.form()} className="flex flex-col gap-5">
                        {({ processing, errors }) => (
                            <>
                                <div className="flex flex-col gap-1">
                                    <label
                                        htmlFor="email"
                                        className="text-xs font-semibold uppercase tracking-widest"
                                        style={{ color: '#6b7280' }}
                                    >
                                        Email Address
                                    </label>
                                    <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: '#d1d5db' }}>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            autoComplete="off"
                                            placeholder="email@example.com"
                                            className="flex-1 py-3 px-3 text-sm outline-none bg-transparent"
                                            style={{ color: '#0d1b2a' }}
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-base font-semibold transition-opacity disabled:opacity-70"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                >
                                    {processing ? <Spinner /> : 'Send Reset Link'}
                                </button>

                                <p className="text-center text-sm" style={{ color: '#6b7280' }}>
                                    Remember your password?{' '}
                                    <TextLink href={login()} className="font-bold underline" style={{ color: '#0d1b2a' }}>
                                        Log in
                                    </TextLink>
                                </p>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}
