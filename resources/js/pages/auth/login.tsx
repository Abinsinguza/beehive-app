import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
    return (
        <>
            <Head title="Log in" />

            <div className="min-h-screen w-full bg-[#f0ede8] flex flex-col items-center justify-center px-4">

                {/* Logo + App name */}
                <div className="flex flex-col items-center gap-2 mb-5">
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0d1b2a' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-8 h-8" fill="#f5a623">
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
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0d1b2a' }}>SwarmIntel</h1>
                    <p className="text-xs" style={{ color: '#6b7280' }}>Professional Bee Monitoring Administration</p>
                </div>

                {/* Login card */}
                <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold" style={{ color: '#0d1b2a' }}>Admin Login</h2>
                        <div className="mt-1.5 h-1 w-10 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                    </div>

                    {status && (
                        <div className="mb-3 text-center text-sm font-medium text-green-600">{status}</div>
                    )}

                    <Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-3">
                        {({ processing, errors }) => (
                            <>
                                {/* Email */}
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>
                                        Email Address
                                    </label>
                                    <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: '#d1d5db' }}>
                                        <input
                                            id="email" type="email" name="email" required autoFocus
                                            tabIndex={1} autoComplete="email" placeholder="email@example.com"
                                            className="flex-1 py-2.5 px-3 text-sm outline-none bg-transparent"
                                            style={{ color: '#0d1b2a' }}
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                {/* Password */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>
                                            Password
                                        </label>
                                        {canResetPassword && (
                                            <TextLink href={request()} tabIndex={5} className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>
                                                Forgot Password
                                            </TextLink>
                                        )}
                                    </div>
                                    <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: '#d1d5db' }}>
                                        <span className="px-3 text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </span>
                                        <input
                                            id="password" type="password" name="password" required
                                            tabIndex={2} autoComplete="current-password" placeholder="••••••••"
                                            className="flex-1 py-2.5 pr-3 text-sm outline-none bg-transparent"
                                            style={{ color: '#0d1b2a' }}
                                        />
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit" tabIndex={4} disabled={processing}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold mt-1 transition-opacity disabled:opacity-70"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                >
                                    {processing ? <Spinner /> : <>Login <span>→</span></>}
                                </button>

                                {/* Sign up */}
                                {canRegister && (
                                    <p className="text-center text-sm" style={{ color: '#6b7280' }}>
                                        Don't have an account?{' '}
                                        <TextLink href={register()} tabIndex={6} className="font-bold underline" style={{ color: '#0d1b2a' }}>
                                            Sign up
                                        </TextLink>
                                    </p>
                                )}
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}
