import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <>
            <Head title="Register" />

            <div className="min-h-screen w-full" style={{ backgroundColor: '#f0ede8' }}>
                {/* Top nav bar */}
                <div className="w-full px-6 py-4" style={{ backgroundColor: '#0d1b2a' }}>
                    <span className="text-sm font-bold tracking-widest uppercase" style={{ color: '#f5a623' }}>
                        BSADS
                    </span>
                </div>

                {/* Centered card */}
                <div className="flex items-center justify-center px-4 py-16">
                    <div className="w-full max-w-lg rounded-xl overflow-hidden shadow-md">
                        {/* Card dark header */}
                        <div className="px-8 py-7" style={{ backgroundColor: '#0d1b2a' }}>
                            <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: '#f5a623' }}>
                                Create Account
                            </h1>
                            <p className="mt-1 text-sm" style={{ color: '#cbd5e1' }}>
                                Join the swarm monitoring network
                            </p>
                        </div>

                        {/* Card white form area */}
                        <div className="bg-white px-8 py-7">
                            <Form
                                {...store.form()}
                                resetOnSuccess={['password', 'password_confirmation']}
                                disableWhileProcessing
                                className="flex flex-col gap-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        {/* Full Name */}
                                        <div className="flex flex-col gap-1">
                                            <label
                                                htmlFor="name"
                                                className="text-xs font-semibold uppercase tracking-widest"
                                                style={{ color: '#6b7280' }}
                                            >
                                                Full Name
                                            </label>
                                            <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: '#d1d5db' }}>
                                                <span className="px-3 text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </span>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    name="name"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="name"
                                                    placeholder="Enter your full name"
                                                    className="flex-1 py-3 pr-3 text-sm outline-none bg-transparent"
                                                    style={{ color: '#0d1b2a' }}
                                                />
                                            </div>
                                            <InputError message={errors.name} />
                                        </div>

                                        {/* Email */}
                                        <div className="flex flex-col gap-1">
                                            <label
                                                htmlFor="email"
                                                className="text-xs font-semibold uppercase tracking-widest"
                                                style={{ color: '#6b7280' }}
                                            >
                                                Email Address
                                            </label>
                                            <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: '#d1d5db' }}>
                                                <span className="px-3 text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </span>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="email"
                                                    placeholder="example@gmail.com"
                                                    className="flex-1 py-3 pr-3 text-sm outline-none bg-transparent"
                                                    style={{ color: '#0d1b2a' }}
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        {/* Password */}
                                        <div className="flex flex-col gap-1">
                                            <label
                                                htmlFor="password"
                                                className="text-xs font-semibold uppercase tracking-widest"
                                                style={{ color: '#6b7280' }}
                                            >
                                                Password
                                            </label>
                                            <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: '#d1d5db' }}>
                                                <span className="px-3 text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                </span>
                                                <input
                                                    id="password"
                                                    type="password"
                                                    name="password"
                                                    required
                                                    tabIndex={3}
                                                    autoComplete="new-password"
                                                    placeholder="••••••••"
                                                    className="flex-1 py-3 pr-3 text-sm outline-none bg-transparent"
                                                    style={{ color: '#0d1b2a' }}
                                                />
                                            </div>
                                            <InputError message={errors.password} />
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="flex flex-col gap-1">
                                            <label
                                                htmlFor="password_confirmation"
                                                className="text-xs font-semibold uppercase tracking-widest"
                                                style={{ color: '#6b7280' }}
                                            >
                                                Confirm Password
                                            </label>
                                            <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: '#d1d5db' }}>
                                                <span className="px-3 text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                </span>
                                                <input
                                                    id="password_confirmation"
                                                    type="password"
                                                    name="password_confirmation"
                                                    required
                                                    tabIndex={4}
                                                    autoComplete="new-password"
                                                    placeholder="••••••••"
                                                    className="flex-1 py-3 pr-3 text-sm outline-none bg-transparent"
                                                    style={{ color: '#0d1b2a' }}
                                                />
                                            </div>
                                            <InputError message={errors.password_confirmation} />
                                        </div>

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            tabIndex={5}
                                            disabled={processing}
                                            data-test="register-user-button"
                                            className="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-widest mt-1 transition-opacity disabled:opacity-70"
                                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                        >
                                            {processing ? <Spinner /> : 'Register'}
                                        </button>

                                        {/* Divider + login link */}
                                        <div className="border-t pt-4 text-center text-sm" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
                                            Already have an account?{' '}
                                            <TextLink
                                                href={login()}
                                                tabIndex={6}
                                                className="font-bold underline"
                                                style={{ color: '#f5a623' }}
                                            >
                                                Login
                                            </TextLink>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
